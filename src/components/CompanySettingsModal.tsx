
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Settings } from 'lucide-react';
import CompanyPhoneSettings from './settings/modal/CompanyPhoneSettings';
import SlugSettingsSection from './settings/modal/SlugSettingsSection';
import WorkingDaysSettings from './settings/modal/WorkingDaysSettings';
import WorkingHoursSettings from './settings/modal/WorkingHoursSettings';
import LunchBreakSettings from './settings/modal/LunchBreakSettings';
import AppointmentSettings from './settings/modal/AppointmentSettings';
import SettingsHelpSection from './settings/modal/SettingsHelpSection';
import { getStorageData, setStorageData, MockCompanySettings, STORAGE_KEYS } from '@/data/mockData';

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CompanySettingsModal = ({ isOpen, onClose, onSuccess }: CompanySettingsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [workingHoursStart, setWorkingHoursStart] = useState('09:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('18:00');
  const [appointmentInterval, setAppointmentInterval] = useState(30);
  const [maxSimultaneousAppointments, setMaxSimultaneousAppointments] = useState(1);
  const [advanceBookingLimit, setAdvanceBookingLimit] = useState(30);
  const [monthlyAppointmentsLimit, setMonthlyAppointmentsLimit] = useState(4);
  const [phone, setPhone] = useState('');
  const [slug, setSlug] = useState('');
  const [originalSlug, setOriginalSlug] = useState('');
  
  // Lunch break settings
  const [lunchBreakEnabled, setLunchBreakEnabled] = useState(false);
  const [lunchStartTime, setLunchStartTime] = useState('12:00');
  const [lunchEndTime, setLunchEndTime] = useState('13:00');

  useEffect(() => {
    if (isOpen && user) {
      loadSettings();
    }
  }, [isOpen, user]);

  const loadSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const settings = getStorageData<MockCompanySettings>(STORAGE_KEYS.COMPANY_SETTINGS, null);

      if (settings) {
        setWorkingDays(settings.working_days);
        setWorkingHoursStart(settings.working_hours_start);
        setWorkingHoursEnd(settings.working_hours_end);
        setAppointmentInterval(settings.appointment_duration);
        setMaxSimultaneousAppointments(1); // não existe no mock
        setAdvanceBookingLimit(settings.advance_booking_days);
        setMonthlyAppointmentsLimit(settings.monthly_appointments_limit || 4);
        setPhone(settings.company_phone || '');
        setSlug(settings.company_slug || '');
        setOriginalSlug(settings.company_slug || '');
        setLunchBreakEnabled(!!settings.lunch_break_start);
        setLunchStartTime(settings.lunch_break_start || '12:00');
        setLunchEndTime(settings.lunch_break_end || '13:00');
      }

    } catch (error: any) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (workingDays.length === 0) {
      toast({
        title: "Dias de trabalho",
        description: "Selecione pelo menos um dia de funcionamento.",
        variant: "destructive",
      });
      return;
    }

    if (workingHoursStart >= workingHoursEnd) {
      toast({
        title: "Horários inválidos",
        description: "O horário de início deve ser menor que o de fim.",
        variant: "destructive",
      });
      return;
    }

    if (lunchBreakEnabled && lunchStartTime >= lunchEndTime) {
      toast({
        title: "Horários de almoço inválidos",
        description: "O horário de início do almoço deve ser menor que o de fim.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const currentSettings = getStorageData<MockCompanySettings>(STORAGE_KEYS.COMPANY_SETTINGS, null);
      
      const updatedSettings: MockCompanySettings = {
        ...currentSettings!,
        working_days: workingDays,
        working_hours_start: workingHoursStart,
        working_hours_end: workingHoursEnd,
        appointment_duration: appointmentInterval,
        advance_booking_days: advanceBookingLimit,
        monthly_appointments_limit: monthlyAppointmentsLimit,
        company_phone: phone || undefined,
        company_slug: slug,
        lunch_break_start: lunchBreakEnabled ? lunchStartTime : undefined,
        lunch_break_end: lunchBreakEnabled ? lunchEndTime : undefined,
      };

      setStorageData(STORAGE_KEYS.COMPANY_SETTINGS, updatedSettings);

      toast({
        title: "Configurações salvas!",
        description: "As configurações foram atualizadas com sucesso.",
      });

      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-whatsapp-green" />
            Configurações da Agenda
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <CompanyPhoneSettings 
              phone={phone} 
              onPhoneChange={setPhone} 
            />

            <Separator />

            <SlugSettingsSection 
              slug={slug} 
              originalSlug={originalSlug} 
              onSlugChange={setSlug} 
            />

            <Separator />

            <AppointmentSettings
              appointmentInterval={appointmentInterval}
              maxSimultaneousAppointments={maxSimultaneousAppointments}
              advanceBookingLimit={advanceBookingLimit}
              monthlyAppointmentsLimit={monthlyAppointmentsLimit}
              onAppointmentIntervalChange={setAppointmentInterval}
              onMaxSimultaneousAppointmentsChange={setMaxSimultaneousAppointments}
              onAdvanceBookingLimitChange={setAdvanceBookingLimit}
              onMonthlyAppointmentsLimitChange={setMonthlyAppointmentsLimit}
            />

            <Separator />

            <WorkingDaysSettings 
              workingDays={workingDays} 
              onWorkingDaysChange={setWorkingDays} 
            />

            <WorkingHoursSettings 
              workingHoursStart={workingHoursStart}
              workingHoursEnd={workingHoursEnd}
              onWorkingHoursStartChange={setWorkingHoursStart}
              onWorkingHoursEndChange={setWorkingHoursEnd}
            />

            <Separator />

            <LunchBreakSettings 
              lunchBreakEnabled={lunchBreakEnabled}
              lunchStartTime={lunchStartTime}
              lunchEndTime={lunchEndTime}
              onLunchBreakEnabledChange={setLunchBreakEnabled}
              onLunchStartTimeChange={setLunchStartTime}
              onLunchEndTimeChange={setLunchEndTime}
            />

            <Separator />

            <SettingsHelpSection />

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-whatsapp-green hover:bg-green-600"
              >
                {submitting ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CompanySettingsModal;
