import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';
import { 
  fetchCompanySettings, 
  fetchCompanyProfile,
  updateCompanySettings,
  updateCompanyProfile,
  saveAllSettings,
  CompanySettingsUpdate,
  ProfileUpdate
} from '@/services/companySettingsService';

// Interfaces para os dados do formulário
export interface GeneralSettingsData {
  maxSimultaneousBookings: number;
  agendaTimeLimit: number;
  timeInterval: number;
}

export interface CompanyDataSettingsData {
  name: string;
  address: string;
  phone: string;
  email: string;
  instagramUrl: string;
  customUrl: string;
}

export interface WorkingDay {
  active: boolean;
  start: string;
  end: string;
  lunchStart: string;
  lunchEnd: string;
}

export interface WorkingDays {
  monday: WorkingDay;
  tuesday: WorkingDay;
  wednesday: WorkingDay;
  thursday: WorkingDay;
  friday: WorkingDay;
  saturday: WorkingDay;
  sunday: WorkingDay;
}

export const useCompanySettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados para as configurações
  const [generalSettings, setGeneralSettings] = useState<GeneralSettingsData>({
    maxSimultaneousBookings: 3,
    agendaTimeLimit: 30,
    timeInterval: 30
  });

  const [companyBasicData, setCompanyBasicData] = useState<CompanyDataSettingsData>({
    name: '',
    address: '',
    phone: '',
    email: '',
    instagramUrl: '',
    customUrl: ''
  });

  const [workingDays, setWorkingDays] = useState<WorkingDays>({
    monday: { active: true, start: '09:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
    tuesday: { active: true, start: '09:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
    wednesday: { active: true, start: '09:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
    thursday: { active: true, start: '09:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
    friday: { active: true, start: '09:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
    saturday: { active: true, start: '09:00', end: '16:00', lunchStart: '', lunchEnd: '' },
    sunday: { active: false, start: '09:00', end: '18:00', lunchStart: '', lunchEnd: '' }
  });

  const [currentSlug, setCurrentSlug] = useState('');

  // Carregar dados do banco
  const loadSettings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Buscar configurações e perfil em paralelo
      const [settings, profile] = await Promise.all([
        fetchCompanySettings(user.id),
        fetchCompanyProfile(user.id)
      ]);

      if (settings) {
        // Mapear configurações gerais
        setGeneralSettings({
          maxSimultaneousBookings: settings.monthly_appointments_limit || 3,
          agendaTimeLimit: settings.advance_booking_limit || 30,
          timeInterval: settings.appointment_interval || 30
        });

        // Mapear slug
        setCurrentSlug(settings.slug || '');

        // Mapear dados básicos da empresa
        setCompanyBasicData(prev => ({
          ...prev,
          phone: settings.phone || '',
          address: settings.address || '',
          instagramUrl: settings.instagram_url || '',
          customUrl: settings.slug || ''
        }));

        // Mapear dias de funcionamento
        const workingDaysArray = settings.working_days || [1, 2, 3, 4, 5];
        const newWorkingDays = { ...workingDays };
        
        // Resetar todos os dias como inativos
        Object.keys(newWorkingDays).forEach(day => {
          newWorkingDays[day as keyof WorkingDays].active = false;
        });

        // Ativar dias de funcionamento
        const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        workingDaysArray.forEach(dayNum => {
          const dayName = dayMap[dayNum] as keyof WorkingDays;
          if (newWorkingDays[dayName]) {
            newWorkingDays[dayName].active = true;
            newWorkingDays[dayName].start = settings.working_hours_start?.substring(0, 5) || '09:00';
            newWorkingDays[dayName].end = settings.working_hours_end?.substring(0, 5) || '18:00';
            
            if (settings.lunch_break_enabled) {
              newWorkingDays[dayName].lunchStart = settings.lunch_start_time?.substring(0, 5) || '12:00';
              newWorkingDays[dayName].lunchEnd = settings.lunch_end_time?.substring(0, 5) || '13:00';
            }
          }
        });

        setWorkingDays(newWorkingDays);
      }

      if (profile) {
        setCompanyBasicData(prev => ({
          ...prev,
          name: profile.company_name || '',
          email: '' // Email não está no perfil, manter vazio
        }));
      }

    } catch (error: any) {
      devError('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar todas as configurações
  const saveSettings = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);

      // Converter dias de funcionamento para array de números
      const workingDaysArray: number[] = [];
      const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      Object.entries(workingDays).forEach(([dayName, config]) => {
        if (config.active) {
          const dayIndex = dayMap.indexOf(dayName);
          if (dayIndex !== -1) {
            workingDaysArray.push(dayIndex);
          }
        }
      });

      // Determinar se há horário de almoço configurado
      const hasLunchBreak = Object.values(workingDays).some(day => 
        day.active && day.lunchStart && day.lunchEnd
      );

      // Pegar horários do primeiro dia ativo (assumindo que todos têm o mesmo horário)
      const firstActiveDay = Object.values(workingDays).find(day => day.active);
      const workingHoursStart = firstActiveDay?.start + ':00' || '09:00:00';
      const workingHoursEnd = firstActiveDay?.end + ':00' || '18:00:00';
      const lunchStart = firstActiveDay?.lunchStart + ':00' || '12:00:00';
      const lunchEnd = firstActiveDay?.lunchEnd + ':00' || '13:00:00';

      // Preparar dados para atualização
      const settingsUpdate: CompanySettingsUpdate = {
        working_days: workingDaysArray,
        working_hours_start: workingHoursStart,
        working_hours_end: workingHoursEnd,
        appointment_interval: generalSettings.timeInterval,
        advance_booking_limit: generalSettings.agendaTimeLimit,
        monthly_appointments_limit: generalSettings.maxSimultaneousBookings,
        lunch_break_enabled: hasLunchBreak,
        lunch_start_time: lunchStart,
        lunch_end_time: lunchEnd,
        phone: companyBasicData.phone,
        address: companyBasicData.address,
        instagram_url: companyBasicData.instagramUrl
      };

      const profileUpdate: ProfileUpdate = {
        company_name: companyBasicData.name
      };

      // Salvar todas as configurações
      await saveAllSettings(user.id, settingsUpdate, profileUpdate);

      toast({
        title: "Configurações salvas!",
        description: "Todas as alterações foram salvas com sucesso.",
      });

      // Disparar evento para atualizar outros componentes
      window.dispatchEvent(new CustomEvent('settingsUpdated'));

    } catch (error: any) {
      devError('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Carregar dados quando o usuário estiver disponível
  useEffect(() => {
    if (user?.id) {
      loadSettings();
    }
  }, [user?.id]);

  return {
    // Estados
    loading,
    saving,
    generalSettings,
    companyBasicData,
    workingDays,
    currentSlug,
    
    // Setters
    setGeneralSettings,
    setCompanyBasicData,
    setWorkingDays,
    setCurrentSlug,
    
    // Ações
    saveSettings,
    refreshSettings: loadSettings
  };
};