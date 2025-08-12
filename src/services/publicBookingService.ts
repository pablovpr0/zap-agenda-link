import { supabase } from '@/integrations/supabase/client';
import { CompanySettings, Profile, Service } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';
import { getNowInBrazil, getTodayInBrazil, getCurrentTimeInBrazil } from '@/utils/timezone';

export const loadCompanyDataBySlug = async (companySlug: string) => {
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

    if (settingsError) {
      throw new Error(`Erro ao buscar empresa: ${settingsError.message}`);
    }

    if (!settings) {
      throw new Error(`Empresa não encontrada ou não está aceitando agendamentos: ${companySlug}`);
    }

    // Load profile data - new RLS policy allows anon users to read profiles for active companies
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', settings.company_id)
      .maybeSingle();

    let profile = profileData;

    if (!profile) {
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

    return {
      settings,
      profileData: profile,
      servicesData: servicesData || []
    };

  } catch (error: any) {
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
      throw error;
    }

    return data || [];

  } catch (error: any) {
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

  for (const appointment of bookedAppointments) {
    const startTime = appointment.appointment_time.substring(0, 5); // HH:mm
    // Priorizar duração do serviço, depois do appointment, depois padrão 60min
    const duration = appointment.services?.duration || appointment.duration || 60;

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

    for (let i = 0; i < slotsToBlock; i++) {
      const slotMinutes = startMinutes + (i * 30);
      const slotHours = Math.floor(slotMinutes / 60);
      const slotMins = slotMinutes % 60;
      const slot = `${slotHours.toString().padStart(2, '0')}:${slotMins.toString().padStart(2, '0')}`;

      blockedSlots.add(slot);
    }
  }

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
    
    const [hours, minutes] = aptTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    
    for (let i = 0; i < slotsToBlock; i++) {
      const slotMinutes = startMinutes + (i * 30);
      const slotHours = Math.floor(slotMinutes / 60);
      const slotMins = slotMinutes % 60;
      const slot = `${slotHours.toString().padStart(2, '0')}:${slotMins.toString().padStart(2, '0')}`;
      blockedSlots.add(slot);
    }
  }

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
        continue;
      }
    }
    
    // Verificar se serviço terminaria após fechamento
    const serviceEndMin = minutes + serviceDuration;
    if (serviceEndMin > endTotalMin) {
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
        isDuringLunch = true;
      }
      
      // Serviço sobreporia almoço
      if (minutes < lunchStartTotalMin && serviceEndMin > lunchStartTotalMin) {
        isDuringLunch = true;
      }
    }
    
    if (!isDuringLunch && !blockedSlots.has(timeSlot)) {
      availableSlots.push(timeSlot);
    }
  }

  return availableSlots;
};

/**
 * Cache simples para horários disponíveis (invalidado após agendamentos)
 * CORREÇÃO CRÍTICA: Cache reduzido para evitar conflitos de concorrência
 */
let timeSlotsCache: { [key: string]: { data: string[], timestamp: number } } = {};
const CACHE_DURATION = 5000; // REDUZIDO: 5 segundos para evitar conflitos

/**
 * Invalida o cache de horários para uma data específica
 * CORREÇÃO CRÍTICA: Invalidação mais agressiva para evitar conflitos
 */
export const invalidateTimeSlotsCache = (companyId: string, date?: string) => {
  if (date) {
    // Invalidar todos os caches relacionados à data (diferentes durações de serviço)
    Object.keys(timeSlotsCache).forEach(key => {
      if (key.includes(`${companyId}-${date}`)) {
        delete timeSlotsCache[key];
      }
    });
    console.log(`🔄 [CORREÇÃO CRÍTICA] Cache invalidado para empresa ${companyId} na data ${date}`);
  } else {
    // Invalidar todo o cache da empresa
    Object.keys(timeSlotsCache).forEach(key => {
      if (key.startsWith(companyId)) {
        delete timeSlotsCache[key];
      }
    });
    console.log(`🔄 [CORREÇÃO CRÍTICA] Todo cache invalidado para empresa ${companyId}`);
  }
};

/**
 * NOVA FUNÇÃO: Verificação de disponibilidade em tempo real
 * Verifica se um horário específico ainda está disponível antes do agendamento
 */
export const verifyTimeSlotAvailability = async (
  companyId: string,
  selectedDate: string,
  selectedTime: string,
  serviceDuration: number = 60
): Promise<boolean> => {
  try {
    // Buscar agendamentos mais recentes
    const { data: conflicts } = await supabase
      .from('appointments')
      .select('appointment_time, duration, services(duration)')
      .eq('company_id', companyId)
      .eq('appointment_date', selectedDate)
      .in('status', ['confirmed', 'completed', 'in_progress']);

    if (!conflicts) return true;

    // Verificar se há conflito com o horário solicitado
    const requestedMinutes = timeToMinutes(selectedTime);
    const serviceEndMinutes = requestedMinutes + serviceDuration;

    for (const conflict of conflicts) {
      const conflictMinutes = timeToMinutes(conflict.appointment_time.substring(0, 5));
      const conflictDuration = conflict.services?.duration || conflict.duration || 60;
      const conflictEndMinutes = conflictMinutes + conflictDuration;

      // Verificar sobreposição
      if (
        (requestedMinutes >= conflictMinutes && requestedMinutes < conflictEndMinutes) ||
        (serviceEndMinutes > conflictMinutes && serviceEndMinutes <= conflictEndMinutes) ||
        (requestedMinutes <= conflictMinutes && serviceEndMinutes >= conflictEndMinutes)
      ) {
        console.log(`🚨 [CORREÇÃO CRÍTICA] Conflito detectado: ${selectedTime} conflita com ${conflict.appointment_time}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar disponibilidade:', error);
    return false;
  }
};

// Função auxiliar para converter horário em minutos
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * FUNÇÃO PRINCIPAL - SISTEMA DE AGENDAMENTO CORRIGIDO
 * 
 * Versão simplificada e robusta que garante o funcionamento
 * AJUSTE 1: Horários selecionados são removidos da lista automaticamente
 */
export const checkAvailableTimes = async (
  companyId: string,
  selectedDate: string,
  serviceDuration?: number
) => {
  // CORREÇÃO CRÍTICA: Sempre buscar dados frescos para evitar conflitos de concorrência
  // Cache reduzido e verificação em tempo real
  const cacheKey = `${companyId}-${selectedDate}-${serviceDuration || 60}`;
  const cached = timeSlotsCache[cacheKey];
  const now = Date.now();
  
  // Cache muito reduzido para horários críticos
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    // VERIFICAÇÃO ADICIONAL: Re-verificar agendamentos recentes mesmo com cache
    const { data: recentBookings } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('company_id', companyId)
      .eq('appointment_date', selectedDate)
      .in('status', ['confirmed', 'completed', 'in_progress'])
      .gte('created_at', new Date(now - 10000).toISOString()); // Últimos 10 segundos
    
    if (recentBookings && recentBookings.length > 0) {
      // Se há agendamentos recentes, invalidar cache e buscar dados frescos
      delete timeSlotsCache[cacheKey];
      console.log(`🔄 [CORREÇÃO CRÍTICA] Cache invalidado devido a agendamentos recentes`);
    } else {
      return cached.data;
    }
  }

  try {
    // ETAPA 1: Validar data
    const today = getTodayInBrazil();
    
    if (selectedDate < today) {
      return [];
    }

    // ETAPA 2: Verificar dia da semana
    const date = new Date(selectedDate + 'T12:00:00');
    const dayOfWeek = date.getDay();

    // ETAPA 3: Buscar configuração
    const { data: dailySchedule, error: scheduleError } = await supabase
      .from('daily_schedules')
      .select('*')
      .eq('company_id', companyId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();

    if (scheduleError) {
      return [];
    }

    if (!dailySchedule || !dailySchedule.is_active) {
      return [];
    }

    // ETAPA 4: Buscar agendamentos confirmados e concluídos (AJUSTE 1: Incluir todos os status que bloqueiam horários)
    const { data: bookedAppointments } = await supabase
      .from('appointments')
      .select('appointment_time, duration, status, services(duration)')
      .eq('company_id', companyId)
      .eq('appointment_date', selectedDate)
      .in('status', ['confirmed', 'completed', 'in_progress']);

    // ETAPA 5: Gerar horários (versão simplificada) - AJUSTE 1: Horários ocupados são automaticamente removidos
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

    // Armazenar no cache
    timeSlotsCache[cacheKey] = {
      data: availableSlots,
      timestamp: now
    };

    // CORREÇÃO CRÍTICA: Verificação final em tempo real antes de retornar
    const finalVerification = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('company_id', companyId)
      .eq('appointment_date', selectedDate)
      .in('status', ['confirmed', 'completed', 'in_progress']);

    if (finalVerification.data) {
      const recentlyBookedTimes = new Set(
        finalVerification.data.map(apt => apt.appointment_time.substring(0, 5))
      );
      
      // Filtrar horários que foram agendados após o cache
      const finalAvailableSlots = availableSlots.filter(slot => !recentlyBookedTimes.has(slot));
      
      if (finalAvailableSlots.length !== availableSlots.length) {
        console.log(`🚨 [CORREÇÃO CRÍTICA] ${availableSlots.length - finalAvailableSlots.length} horários removidos por conflito de concorrência`);
        
        // Atualizar cache com dados corretos
        timeSlotsCache[cacheKey] = {
          data: finalAvailableSlots,
          timestamp: now
        };
        
        return finalAvailableSlots;
      }
    }

    console.log(`✅ [CORREÇÃO CRÍTICA] Horários verificados para ${selectedDate}: ${availableSlots.length} slots (${availableSlots.join(', ')})`);

    return availableSlots;

  } catch (error: any) {
    console.error('❌ Erro ao buscar horários disponíveis:', error);
    return [];
  }
};