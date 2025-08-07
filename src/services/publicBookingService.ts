import { supabase } from '@/integrations/supabase/client';
import { CompanySettings, Profile, Service } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';
import { getNowInBrazil, getTodayInBrazil, getCurrentTimeInBrazil } from '@/utils/timezone';

export const loadCompanyDataBySlug = async (companySlug: string) => {
  console.log('🔍 Loading company data with secure policies:', companySlug);

  if (!companySlug || companySlug.trim() === '') {
    throw new Error('Slug da empresa é obrigatório');
  }

  try {
    // The new RLS policy allows anon users to read company_settings where status_aberto = true
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .eq('slug', companySlug.trim())
      .eq('status_aberto', true) // Only get active companies
      .maybeSingle();

    console.log('📊 Company settings result:', { settings, settingsError });

    if (settingsError) {
      console.error('❌ Error loading company settings:', settingsError);
      throw new Error(`Erro ao buscar empresa: ${settingsError.message}`);
    }

    if (!settings) {
      console.error('❌ Company not found or not active:', companySlug);
      throw new Error(`Empresa não encontrada ou não está aceitando agendamentos: ${companySlug}`);
    }

    // Load profile data - new RLS policy allows anon users to read profiles for active companies
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', settings.company_id)
      .maybeSingle();

    let profile = profileData;

    if (profileError) {
      console.warn('⚠️ Profile loading error (non-critical):', profileError);
    }

    if (!profile) {
      console.warn('⚠️ Profile not found, creating minimal profile');
      profile = {
        id: settings.company_id,
        company_name: 'Empresa',
        business_type: 'Serviços',
        profile_image_url: null,
        created_at: getNowInBrazil().toISOString(),
        updated_at: getNowInBrazil().toISOString()
      };
    }

    // Load services - new RLS policy allows anon users to read active services for active companies
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('company_id', settings.company_id)
      .eq('is_active', true) // Only active services
      .order('name');

    if (servicesError) {
      console.warn('⚠️ Services loading error (non-critical):', servicesError);
    }

    console.log('✅ Company data loaded successfully:', {
      company_id: settings.company_id,
      services_count: servicesData?.length || 0
    });

    return {
      settings,
      profileData: profile,
      servicesData: servicesData || []
    };

  } catch (error: any) {
    console.error('❌ Failed to load company data:', error);
    throw error;
  }
};

export const fetchActiveProfessionals = async (companyId: string): Promise<Professional[]> => {
  try {
    // New RLS policy allows anon users to read active professionals for active companies
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('❌ Error loading professionals:', error);
      throw error;
    }

    console.log('👨‍💼 Professionals loaded:', data?.length || 0);
    return data || [];

  } catch (error: any) {
    console.error('❌ Failed to load professionals:', error);
    throw error;
  }
};

/**
 * SISTEMA DE BLOQUEIO DE HORÁRIOS - LÓGICA CORRIGIDA
 * 
 * Regras específicas de bloqueio:
 * - Serviço 30min: bloqueia APENAS o horário selecionado
 * - Serviço 60min: bloqueia o horário selecionado + o próximo (30min depois)
 * - Serviços maiores: bloqueia todos os slots necessários
 */
const generateBlockedTimeSlots = (
  bookedAppointments: Array<{
    appointment_time: string;
    duration?: number;
    status: string;
    services?: { duration: number };
  }>
): Set<string> => {
  const blockedSlots = new Set<string>();

  console.log('🚫 [BLOQUEIO] Processando agendamentos existentes:', bookedAppointments.length);

  for (const appointment of bookedAppointments) {
    const startTime = appointment.appointment_time.substring(0, 5); // HH:mm
    // Priorizar duração do serviço, depois do appointment, depois padrão 60min
    const duration = appointment.services?.duration || appointment.duration || 60;

    console.log('🚫 Processando agendamento:', {
      startTime,
      duration: `${duration}min`,
      status: appointment.status,
      source: appointment.services?.duration ? 'services table' : 'appointment table'
    });

    // Converter horário para minutos
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;

    // LÓGICA CORRIGIDA: Calcular slots baseado na duração específica
    let slotsToBlock = 1; // Por padrão, bloqueia apenas 1 slot
    
    if (duration === 30) {
      slotsToBlock = 1; // 30min = apenas o horário selecionado
    } else if (duration === 60) {
      slotsToBlock = 2; // 60min = horário selecionado + próximo
    } else {
      slotsToBlock = Math.ceil(duration / 30); // Para durações maiores
    }

    console.log(`🚫 Serviço de ${duration}min vai bloquear ${slotsToBlock} slots`);

    for (let i = 0; i < slotsToBlock; i++) {
      const slotMinutes = startMinutes + (i * 30);
      const slotHours = Math.floor(slotMinutes / 60);
      const slotMins = slotMinutes % 60;
      const slot = `${slotHours.toString().padStart(2, '0')}:${slotMins.toString().padStart(2, '0')}`;

      blockedSlots.add(slot);
      console.log(`🚫 Bloqueando slot ${i + 1}/${slotsToBlock}: ${slot}`);
    }

    console.log(`✅ Bloqueados ${slotsToBlock} slots para serviço de ${duration}min iniciando em ${startTime}`);
  }

  const sortedBlockedSlots = Array.from(blockedSlots).sort();
  console.log('🚫 [BLOQUEIO] Total de slots bloqueados:', sortedBlockedSlots);

  return blockedSlots;
};

/**
 * GERADOR SIMPLIFICADO DE HORÁRIOS - VERSÃO CORRIGIDA
 */
const generateSimpleTimeSlots = (
  startTime: string,
  endTime: string,
  serviceDuration: number,
  bookedAppointments: Array<{appointment_time: string, duration?: number, status: string}>,
  hasLunchBreak: boolean,
  lunchStart?: string,
  lunchEnd?: string,
  selectedDate?: string
): string[] => {
  console.log('🕐 [GERADOR SIMPLES] Iniciando:', {
    startTime,
    endTime,
    serviceDuration,
    bookedCount: bookedAppointments.length,
    hasLunchBreak,
    selectedDate
  });

  const availableSlots: string[] = [];
  
  // Normalizar horários
  const normalizeTime = (time: string) => {
    if (!time) return '';
    if (time.length === 5) return time; // HH:mm
    if (time.length === 8) return time.substring(0, 5); // HH:mm:ss -> HH:mm
    return time;
  };

  const start = normalizeTime(startTime);
  const end = normalizeTime(endTime);
  const lunchStartNorm = lunchStart ? normalizeTime(lunchStart) : null;
  const lunchEndNorm = lunchEnd ? normalizeTime(lunchEnd) : null;

  console.log('🕐 [NORMALIZADO]:', { start, end, lunchStartNorm, lunchEndNorm });

  // Verificar se é hoje
  const today = getTodayInBrazil();
  const isToday = selectedDate === today;
  let currentTime = null;
  
  if (isToday) {
    try {
      currentTime = getCurrentTimeInBrazil();
      console.log('⏰ [HOJE] Hora atual obtida:', currentTime);
    } catch (error) {
      console.error('❌ Erro ao obter hora atual, usando fallback:', error);
      // Fallback: calcular hora atual manualmente
      const now = new Date();
      const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      currentTime = `${brazilTime.getHours().toString().padStart(2, '0')}:${brazilTime.getMinutes().toString().padStart(2, '0')}`;
      console.log('⏰ [FALLBACK] Hora calculada:', currentTime);
    }
  }

  // Gerar slots bloqueados com lógica corrigida
  const blockedSlots = new Set<string>();
  for (const apt of bookedAppointments) {
    const aptTime = normalizeTime(apt.appointment_time);
    const duration = apt.duration || 60;
    
    // LÓGICA CORRIGIDA: Bloquear slots baseado na duração específica
    let slotsToBlock = 1; // Por padrão, bloqueia apenas 1 slot
    
    if (duration === 30) {
      slotsToBlock = 1; // 30min = apenas o horário selecionado
    } else if (duration === 60) {
      slotsToBlock = 2; // 60min = horário selecionado + próximo
    } else {
      slotsToBlock = Math.ceil(duration / 30); // Para durações maiores
    }
    
    console.log(`🚫 [BLOQUEIO SIMPLES] Serviço de ${duration}min em ${aptTime} vai bloquear ${slotsToBlock} slots`);
    
    const [hours, minutes] = aptTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    
    for (let i = 0; i < slotsToBlock; i++) {
      const slotMinutes = startMinutes + (i * 30);
      const slotHours = Math.floor(slotMinutes / 60);
      const slotMins = slotMinutes % 60;
      const slot = `${slotHours.toString().padStart(2, '0')}:${slotMins.toString().padStart(2, '0')}`;
      blockedSlots.add(slot);
      console.log(`🚫 Bloqueando slot ${i + 1}/${slotsToBlock}: ${slot}`);
    }
  }

  console.log('🚫 [BLOQUEADOS]:', Array.from(blockedSlots).sort());

  // Gerar horários de 30 em 30 minutos
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  
  const startTotalMin = startHour * 60 + startMin;
  const endTotalMin = endHour * 60 + endMin;
  
  for (let minutes = startTotalMin; minutes < endTotalMin; minutes += 30) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const timeSlot = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    
    // Verificar se é horário passado
    if (isToday && currentTime) {
      const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
      const currentTotalMin = currentHours * 60 + currentMinutes;
      
      if (minutes <= currentTotalMin) {
        console.log(`⏰ Pulando passado: ${timeSlot}`);
        continue;
      }
    }
    
    // Verificar se serviço terminaria após fechamento
    const serviceEndMin = minutes + serviceDuration;
    if (serviceEndMin > endTotalMin) {
      console.log(`⏰ Serviço terminaria após fechamento: ${timeSlot}`);
      break;
    }
    
    // Verificar almoço
    let isDuringLunch = false;
    if (hasLunchBreak && lunchStartNorm && lunchEndNorm) {
      const [lunchStartHour, lunchStartMin] = lunchStartNorm.split(':').map(Number);
      const [lunchEndHour, lunchEndMin] = lunchEndNorm.split(':').map(Number);
      
      const lunchStartTotalMin = lunchStartHour * 60 + lunchStartMin;
      const lunchEndTotalMin = lunchEndHour * 60 + lunchEndMin;
      
      // Horário durante almoço
      if (minutes >= lunchStartTotalMin && minutes < lunchEndTotalMin) {
        console.log(`🍽️ Durante almoço: ${timeSlot}`);
        isDuringLunch = true;
      }
      
      // Serviço sobreporia almoço
      if (minutes < lunchStartTotalMin && serviceEndMin > lunchStartTotalMin) {
        console.log(`🍽️ Sobreporia almoço: ${timeSlot}`);
        isDuringLunch = true;
      }
    }
    
    if (!isDuringLunch && !blockedSlots.has(timeSlot)) {
      availableSlots.push(timeSlot);
      console.log(`✅ Disponível: ${timeSlot}`);
    }
  }

  console.log('🎯 [RESULTADO SIMPLES]:', {
    total: availableSlots.length,
    slots: availableSlots,
    debug: {
      selectedDate,
      isToday: selectedDate === '2025-08-07',
      currentTime,
      serviceDuration
    }
  });

  // ALERTA se não há horários
  if (availableSlots.length === 0) {
    console.warn('⚠️ [ALERTA] NENHUM HORÁRIO DISPONÍVEL!');
    console.warn('Parâmetros:', { startTime, endTime, serviceDuration, hasLunchBreak, lunchStart, lunchEnd });
    console.warn('Estado:', { selectedDate, isToday: selectedDate === '2025-08-07', currentTime });
  }

  return availableSlots;
};

/**
 * FUNÇÃO PRINCIPAL - SISTEMA DE AGENDAMENTO CORRIGIDO
 * 
 * Versão simplificada e robusta que garante o funcionamento
 */
export const checkAvailableTimes = async (
  companyId: string,
  selectedDate: string,
  serviceDuration?: number
) => {
  console.log('🔍 [AGENDAMENTO] Iniciando verificação:', {
    companyId,
    selectedDate,
    serviceDuration: serviceDuration || 60
  });

  try {
    // ETAPA 1: Validar data
    const today = getTodayInBrazil();
    console.log('📅 [DATA] Validação:', { selectedDate, today, isPast: selectedDate < today });
    
    if (selectedDate < today) {
      console.log('❌ Data é passada');
      return [];
    }

    // ETAPA 2: Verificar dia da semana
    const date = new Date(selectedDate + 'T12:00:00');
    const dayOfWeek = date.getDay();
    console.log('📅 [DIA] Quinta-feira é 4:', { dayOfWeek, isThursday: dayOfWeek === 4 });

    // ETAPA 3: Buscar configuração
    const { data: dailySchedule, error: scheduleError } = await supabase
      .from('daily_schedules')
      .select('*')
      .eq('company_id', companyId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();

    console.log('📋 [CONFIG] Resultado da consulta:', { 
      found: !!dailySchedule, 
      isActive: dailySchedule?.is_active,
      error: scheduleError 
    });

    if (scheduleError) {
      console.error('❌ Erro na consulta:', scheduleError);
      return [];
    }

    if (!dailySchedule || !dailySchedule.is_active) {
      console.log('❌ Dia não ativo ou não encontrado');
      return [];
    }

    console.log('✅ [CONFIG] Configuração encontrada:', {
      start: dailySchedule.start_time,
      end: dailySchedule.end_time,
      lunch: dailySchedule.has_lunch_break ? `${dailySchedule.lunch_start}-${dailySchedule.lunch_end}` : 'Não'
    });

    // ETAPA 4: Buscar agendamentos (simplificado)
    const { data: bookedAppointments } = await supabase
      .from('appointments')
      .select('appointment_time, duration, status')
      .eq('company_id', companyId)
      .eq('appointment_date', selectedDate)
      .in('status', ['confirmed', 'completed']);

    console.log('📋 [AGENDAMENTOS] Encontrados:', bookedAppointments?.length || 0);

    // ETAPA 5: Gerar horários (versão simplificada)
    const availableSlots = generateSimpleTimeSlots(
      dailySchedule.start_time,
      dailySchedule.end_time,
      serviceDuration || 60,
      bookedAppointments || [],
      dailySchedule.has_lunch_break,
      dailySchedule.lunch_start,
      dailySchedule.lunch_end,
      selectedDate
    );

    console.log('🎯 [RESULTADO] Horários gerados:', {
      total: availableSlots.length,
      slots: availableSlots
    });

    return availableSlots;

  } catch (error: any) {
    console.error('❌ [ERRO] Falha crítica:', error);
    return [];
  }
};