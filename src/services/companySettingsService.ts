import { supabase } from '@/integrations/supabase/client';
import { devLog, devError } from '@/utils/console';

export interface CompanySettings {
  id: string;
  company_id: string;
  slug?: string;
  logo_url?: string;
  cover_image_url?: string;
  theme_color?: string;
  working_days?: number[];
  working_hours_start?: string;
  working_hours_end?: string;
  lunch_break_enabled?: boolean;
  lunch_start_time?: string;
  lunch_end_time?: string;
  monthly_appointments_limit?: number;
  max_simultaneous_appointments?: number;
  phone?: string;
  whatsapp?: string;
  description?: string;
  instagram_url?: string;
  welcome_message?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateCompanySettingsParams {
  company_id: string;
  slug?: string;
  logo_url?: string;
  cover_image_url?: string;
  theme_color?: string;
  working_days?: number[];
  working_hours_start?: string;
  working_hours_end?: string;
  lunch_break_enabled?: boolean;
  lunch_start_time?: string;
  lunch_end_time?: string;
  monthly_appointments_limit?: number;
  max_simultaneous_appointments?: number;
  phone?: string;
  whatsapp?: string;
  description?: string;
  instagram_url?: string;
  welcome_message?: string;
}

/**
 * Busca as configurações de uma empresa
 */
export const getCompanySettings = async (companyId: string): Promise<CompanySettings | null> => {
  try {
    devLog('🔍 Buscando configurações da empresa:', companyId);
    
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Não encontrou configurações, criar padrão
        devLog('📝 Criando configurações padrão para empresa:', companyId);
        return await createDefaultSettings(companyId);
      }
      throw error;
    }

    devLog('✅ Configurações encontradas:', data);
    return data;
    
  } catch (error) {
    devError('❌ Erro ao buscar configurações:', error);
    return null;
  }
};

/**
 * Cria configurações padrão para uma empresa
 */
export const createDefaultSettings = async (companyId: string): Promise<CompanySettings | null> => {
  try {
    const defaultSettings = {
      company_id: companyId,
      working_days: [1, 2, 3, 4, 5], // Segunda a sexta
      working_hours_start: '09:00:00',
      working_hours_end: '18:00:00',
      lunch_break_enabled: true,
      lunch_start_time: '12:00:00',
      lunch_end_time: '13:00:00',
      monthly_appointments_limit: 50,
      max_simultaneous_appointments: 3,
      slug: `empresa-${companyId.slice(0, 8)}`,
      theme_color: '#3B82F6'
    };

    const { data, error } = await supabase
      .from('company_settings')
      .insert(defaultSettings)
      .select()
      .single();

    if (error) throw error;

    devLog('✅ Configurações padrão criadas:', data);
    return data;
    
  } catch (error) {
    devError('❌ Erro ao criar configurações padrão:', error);
    return null;
  }
};

/**
 * Atualiza as configurações de uma empresa
 */
export const updateCompanySettings = async (params: UpdateCompanySettingsParams): Promise<CompanySettings | null> => {
  try {
    devLog('🔄 Atualizando configurações da empresa:', params);
    
    const { company_id, ...updateData } = params;
    
    const { data, error } = await supabase
      .from('company_settings')
      .update(updateData)
      .eq('company_id', company_id)
      .select()
      .single();

    if (error) throw error;

    devLog('✅ Configurações atualizadas:', data);
    
    // Disparar evento de atualização para sincronização em tempo real
    await notifySettingsUpdate(company_id);
    
    return data;
    
  } catch (error) {
    devError('❌ Erro ao atualizar configurações:', error);
    return null;
  }
};

/**
 * Notifica sobre atualização de configurações via Realtime
 */
export const notifySettingsUpdate = async (companyId: string): Promise<void> => {
  try {
    // Enviar evento via Realtime para invalidar cache
    const channel = supabase.channel(`company-settings-${companyId}`);
    
    await channel.send({
      type: 'broadcast',
      event: 'settings_updated',
      payload: {
        company_id: companyId,
        timestamp: new Date().toISOString()
      }
    });
    
    devLog('📡 Evento de atualização enviado:', companyId);
    
  } catch (error) {
    devError('❌ Erro ao enviar notificação:', error);
  }
};

/**
 * Gera horários disponíveis baseado nas configurações da empresa
 */
export const generateAvailableSlots = (
  settings: CompanySettings,
  date: Date,
  existingAppointments: Array<{ appointment_time: string; service_duration?: number }>
): string[] => {
  const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
  const daySettings = settings.opening_hours[dayOfWeek];
  
  if (!daySettings || !daySettings.active) {
    return [];
  }
  
  const slots: string[] = [];
  const [openHour, openMinute] = daySettings.open.split(':').map(Number);
  const [closeHour, closeMinute] = daySettings.close.split(':').map(Number);
  
  let currentTime = openHour * 60 + openMinute; // em minutos
  const closeTime = closeHour * 60 + closeMinute;
  
  while (currentTime < closeTime) {
    const hour = Math.floor(currentTime / 60);
    const minute = currentTime % 60;
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Verificar se não está no horário de almoço
    if (settings.lunch_break.active) {
      const [lunchStartHour, lunchStartMinute] = settings.lunch_break.start.split(':').map(Number);
      const [lunchEndHour, lunchEndMinute] = settings.lunch_break.end.split(':').map(Number);
      
      const lunchStart = lunchStartHour * 60 + lunchStartMinute;
      const lunchEnd = lunchEndHour * 60 + lunchEndMinute;
      
      if (currentTime >= lunchStart && currentTime < lunchEnd) {
        currentTime += settings.slot_interval_minutes;
        continue;
      }
    }
    
    // Verificar se não há conflito com agendamentos existentes
    const hasConflict = existingAppointments.some(appointment => {
      const [appHour, appMinute] = appointment.appointment_time.split(':').map(Number);
      const appTime = appHour * 60 + appMinute;
      const appDuration = appointment.service_duration || 30;
      
      return currentTime >= appTime && currentTime < (appTime + appDuration);
    });
    
    if (!hasConflict) {
      slots.push(timeString);
    }
    
    currentTime += settings.slot_interval_minutes;
  }
  
  return slots;
};

/**
 * Verifica se uma data está dentro do limite de agendamento
 */
export const isDateWithinBookingLimit = (
  settings: CompanySettings,
  targetDate: Date
): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Verificar se permite agendamento no mesmo dia
  if (diffDays === 0 && !settings.same_day_booking) {
    return false;
  }
  
  // Verificar limite de dias futuros
  if (diffDays > settings.advance_booking_limit) {
    return false;
  }
  
  return diffDays >= 0;
};

/**
 * Subscreve a mudanças nas configurações da empresa
 */
export const subscribeToSettingsUpdates = (
  companyId: string,
  callback: (settings: CompanySettings) => void
): (() => void) => {
  const channel = supabase.channel(`company-settings-${companyId}`);
  
  channel
    .on('broadcast', { event: 'settings_updated' }, async (payload) => {
      devLog('📡 Configurações atualizadas via Realtime:', payload);
      
      // Recarregar configurações
      const updatedSettings = await getCompanySettings(companyId);
      if (updatedSettings) {
        callback(updatedSettings);
      }
    })
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
};