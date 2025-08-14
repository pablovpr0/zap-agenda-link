
import { supabase } from '@/integrations/supabase/client';
import { devLog, devError, devWarn } from '@/utils/console';

interface DebugBookingParams {
  companyId: string;
  date: string;
  professionalId?: string;
  serviceId?: string;
}

export const debugBookingAvailability = async ({
  companyId,
  date,
  professionalId,
  serviceId
}: DebugBookingParams) => {
  devLog('🔍 [DEBUG] Iniciando debug de disponibilidade de agendamentos');
  devLog('📋 [DEBUG] Parâmetros:', { companyId, date, professionalId, serviceId });

  try {
    // 1. Verificar configurações da empresa
    devLog('1️⃣ [DEBUG] Verificando configurações da empresa...');
    const { data: company, error: companyError } = await supabase
      .from('company_settings')
      .select(`
        company_id,
        working_hours_start,
        working_hours_end,
        lunch_break_enabled,
        lunch_start_time,
        lunch_end_time,
        working_days,
        appointment_interval,
        advance_booking_limit
      `)
      .eq('company_id', companyId)
      .single();

    if (companyError) {
      devError('❌ [DEBUG] Erro ao buscar empresa:', companyError);
      return;
    }

    devLog('✅ [DEBUG] Empresa encontrada:', company);

    // 2. Verificar agendamentos existentes
    devLog('2️⃣ [DEBUG] Verificando agendamentos existentes...');
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        duration,
        status,
        professional_id,
        service_id
      `)
      .eq('company_id', companyId)
      .eq('appointment_date', date)
      .in('status', ['scheduled', 'confirmed']);

    if (appointmentsError) {
      devError('❌ [DEBUG] Erro ao buscar agendamentos:', appointmentsError);
      return;
    }

    devLog('📅 [DEBUG] Agendamentos existentes:', appointments);

    // 3. Verificar profissionais
    if (professionalId) {
      devLog('3️⃣ [DEBUG] Verificando profissional...');
      const { data: professional, error: professionalError } = await supabase
        .from('professionals')
        .select('*')
        .eq('id', professionalId)
        .eq('company_id', companyId)
        .single();

      if (professionalError) {
        devError('❌ [DEBUG] Erro ao buscar profissional:', professionalError);
      } else {
        devLog('👨‍💼 [DEBUG] Profissional encontrado:', professional);
      }
    }

    // 4. Verificar serviços
    if (serviceId) {
      devLog('4️⃣ [DEBUG] Verificando serviço...');
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .eq('company_id', companyId)
        .single();

      if (serviceError) {
        devError('❌ [DEBUG] Erro ao buscar serviço:', serviceError);
      } else {
        devLog('🛎️ [DEBUG] Serviço encontrado:', service);
      }
    }

    // 5. Verificar se é dia de trabalho
    const dateObj = new Date(date + 'T12:00:00');
    const dayOfWeek = dateObj.getDay();
    const workingDays = company.working_days || [1, 2, 3, 4, 5];
    
    devLog('5️⃣ [DEBUG] Verificação de dia útil:');
    devLog('📅 [DEBUG] Dia da semana:', dayOfWeek);
    devLog('🗓️ [DEBUG] Dias de trabalho:', workingDays);
    devLog('✅ [DEBUG] É dia útil?', workingDays.includes(dayOfWeek));

    // 6. Gerar horários disponíveis teoricamente
    devLog('6️⃣ [DEBUG] Gerando horários teóricos...');
    const theoreticalSlots = generateTheoreticalTimeSlots(company);
    devLog('⏰ [DEBUG] Horários teóricos:', theoreticalSlots);

    // 7. Filtrar horários ocupados
    const occupiedSlots = appointments?.map(apt => apt.appointment_time) || [];
    const availableSlots = theoreticalSlots.filter(slot => !occupiedSlots.includes(slot));
    
    devLog('7️⃣ [DEBUG] Análise final:');
    devLog('🚫 [DEBUG] Horários ocupados:', occupiedSlots);
    devLog('✅ [DEBUG] Horários disponíveis:', availableSlots);

    return {
      company,
      appointments,
      theoreticalSlots,
      occupiedSlots,
      availableSlots,
      isWorkingDay: workingDays.includes(dayOfWeek)
    };

  } catch (error) {
    devError('💥 [DEBUG] Erro geral no debug:', error);
    return null;
  }
};

const generateTheoreticalTimeSlots = (company: any): string[] => {
  const slots: string[] = [];
  const startTime = company.working_hours_start || '09:00';
  const endTime = company.working_hours_end || '18:00';
  const interval = company.appointment_interval || 30;
  
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  
  for (let minutes = start; minutes < end; minutes += interval) {
    const timeStr = minutesToTime(minutes);
    
    // Skip lunch break if enabled
    if (company.lunch_break_enabled && company.lunch_start_time && company.lunch_end_time) {
      const lunchStart = timeToMinutes(company.lunch_start_time);
      const lunchEnd = timeToMinutes(company.lunch_end_time);
      
      if (minutes >= lunchStart && minutes < lunchEnd) {
        continue;
      }
    }
    
    slots.push(timeStr);
  }
  
  return slots;
};

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};
