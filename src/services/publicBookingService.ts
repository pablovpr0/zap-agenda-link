import { supabase } from '@/integrations/supabase/client';
import { CompanySettings, Profile, Service } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';
import { getNowInBrazil, getTodayInBrazil, getCurrentTimeInBrazil } from '@/utils/timezone';
import { devLog, devError } from '@/utils/console';

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
        is_admin: false,
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
      devLog('⏰ [HOJE] Hora atual obtida:', currentTime);
    } catch (error) {
      devError('❌ Erro ao obter hora atual, usando fallback:', error);
      // Fallback: calcular hora atual manualmente
      const now = new Date();
      const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      currentTime = `${brazilTime.getHours().toString().padStart(2, '0')}:${brazilTime.getMinutes().toString().padStart(2, '0')}`;
      devLog('⏰ [FALLBACK] Hora calculada:', currentTime);
    }
  }

  // CORREÇÃO CRÍTICA: Bloquear TODOS os horários ocupados
  const blockedSlots = new Set<string>();
  
  devLog(`🚫 [BLOQUEIO] Processando ${bookedAppointments.length} agendamentos para bloquear horários`);
  
  for (const apt of bookedAppointments) {
    // CORREÇÃO CRÍTICA: Normalizar corretamente o horário do banco
    let aptTime = apt.appointment_time;
    
    // Se vem do banco como "09:00:00", converter para "09:00"
    if (aptTime.length === 8) {
      aptTime = aptTime.substring(0, 5);
    }
    
    devLog(`🚫 [BLOQUEIO] Agendamento original: ${apt.appointment_time} -> Normalizado: ${aptTime} - Status: ${apt.status}`);
    
    // SEMPRE bloquear o horário exato do agendamento
    blockedSlots.add(aptTime);
    devLog(`🚫 [BLOQUEIO] Horário ${aptTime} BLOQUEADO`);
    
    // Bloquear horários adicionais baseado na duração
    const duration = apt.duration || apt.services?.duration || 60;
    const slotsToBlock = Math.ceil(duration / 30);
    
    const [hours, minutes] = aptTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    
    for (let i = 1; i < slotsToBlock; i++) { // Começar do 1 pois o 0 já foi bloqueado
      const slotMinutes = startMinutes + (i * 30);
      const slotHours = Math.floor(slotMinutes / 60);
      const slotMins = slotMinutes % 60;
      const slot = `${slotHours.toString().padStart(2, '0')}:${slotMins.toString().padStart(2, '0')}`;
      blockedSlots.add(slot);
      devLog(`🚫 [BLOQUEIO] Horário adicional ${slot} BLOQUEADO (duração: ${duration}min)`);
    }
  }
  
  devLog(`🚫 [BLOQUEIO] Total de horários bloqueados: ${blockedSlots.size}`);
  devLog(`🚫 [BLOQUEIO] Horários bloqueados: [${Array.from(blockedSlots).join(', ')}]`);

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
    
    // Debug detalhado para cada slot
    const isBlocked = blockedSlots.has(timeSlot);
    const reason = [];
    
    if (isDuringLunch) reason.push('almoço');
    if (isBlocked) reason.push('agendado');
    
    if (!isDuringLunch && !isBlocked) {
      availableSlots.push(timeSlot);
      devLog(`✅ [SLOT] ${timeSlot} - DISPONÍVEL`);
    } else {
      devLog(`❌ [SLOT] ${timeSlot} - BLOQUEADO (${reason.join(', ')})`);
    }
  }

  return availableSlots;
};

/**
 * Cache simples para horários disponíveis (invalidado após agendamentos)
 * CORREÇÃO CRÍTICA: Cache mínimo para garantir horários sempre atualizados
 */
let timeSlotsCache: { [key: string]: { data: string[], timestamp: number } } = {};
const CACHE_DURATION = 2000; // ULTRA REDUZIDO: 2 segundos para máxima precisão

/**
 * Invalida o cache de horários para uma data específica
 * CORREÇÃO CRÍTICA: Invalidação mais agressiva para evitar conflitos
 */
export const invalidateTimeSlotsCache = (companyId: string, date?: string) => {
  // CACHE DESABILITADO - SEMPRE BUSCAR DADOS FRESCOS
  devLog(`🔄 [CACHE DESABILITADO] Cache não é mais usado - dados sempre frescos`);
  
  if (date) {
    // Trigger real-time update para todos os clientes conectados
    import('@/utils/realtimeBookingSync').then(({ triggerBookingUpdate }) => {
      triggerBookingUpdate(companyId, date);
      devLog(`📡 [SYNC] Sincronização disparada para ${companyId} na data ${date}`);
    }).catch(() => {
      // Ignore import errors in case module is not available
    });
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
        devLog(`🚨 [CORREÇÃO CRÍTICA] Conflito detectado: ${selectedTime} conflita com ${conflict.appointment_time}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    devError('❌ Erro ao verificar disponibilidade:', error);
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
  serviceDuration?: number,
  forceRefresh: boolean = false
) => {
  devLog(`🔄 [NOVA VERSÃO] Buscando horários para ${selectedDate}`);

  try {
    // 1. Validar data
    const today = getTodayInBrazil();
    if (selectedDate < today) {
      devLog(`❌ Data ${selectedDate} é anterior a hoje ${today}`);
      return [];
    }

    // 2. Buscar configuração do dia
    const date = new Date(selectedDate + 'T12:00:00');
    const dayOfWeek = date.getDay();

    const { data: dailySchedule, error: scheduleError } = await supabase
      .from('daily_schedules')
      .select('*')
      .eq('company_id', companyId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();

    if (scheduleError || !dailySchedule || !dailySchedule.is_active) {
      devLog(`❌ Dia ${dayOfWeek} não configurado ou inativo`);
      return [];
    }

    devLog(`✅ Configuração encontrada: ${dailySchedule.start_time} - ${dailySchedule.end_time}`);

    // 3. Buscar TODOS os agendamentos não cancelados
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('appointment_time, duration, status')
      .eq('company_id', companyId)
      .eq('appointment_date', selectedDate)
      .neq('status', 'cancelled');

    if (appointmentsError) {
      devError('❌ Erro ao buscar agendamentos:', appointmentsError);
      return [];
    }

    devLog(`📋 Agendamentos encontrados: ${appointments?.length || 0}`);
    
    // 4. Criar set de horários ocupados (SIMPLES E DIRETO)
    const occupiedTimes = new Set<string>();
    if (appointments) {
      appointments.forEach(apt => {
        // Normalizar horário: "09:00:00" -> "09:00"
        const timeNormalized = apt.appointment_time.substring(0, 5);
        occupiedTimes.add(timeNormalized);
        devLog(`🚫 Horário ocupado: ${timeNormalized} (status: ${apt.status})`);
      });
    }

    // 5. Gerar todos os horários possíveis
    const allSlots = [];
    const [startHour, startMin] = dailySchedule.start_time.split(':').map(Number);
    const [endHour, endMin] = dailySchedule.end_time.split(':').map(Number);
    
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    
    for (let minutes = startTotalMin; minutes < endTotalMin; minutes += 30) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const timeSlot = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      
      // Verificar se não é horário passado (se for hoje)
      const isToday = selectedDate === today;
      if (isToday) {
        try {
          const currentTime = getCurrentTimeInBrazil();
          const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
          const currentTotalMin = currentHours * 60 + currentMinutes;
          
          if (minutes <= currentTotalMin) {
            continue; // Pular horários passados
          }
        } catch (error) {
          // Se não conseguir obter hora atual, continuar
        }
      }
      
      allSlots.push(timeSlot);
    }

    // 6. Filtrar horários ocupados
    const availableSlots = allSlots.filter(slot => {
      const isOccupied = occupiedTimes.has(slot);
      if (isOccupied) {
        devLog(`❌ ${slot} - OCUPADO`);
      } else {
        devLog(`✅ ${slot} - DISPONÍVEL`);
      }
      return !isOccupied;
    });

    devLog(`🎯 RESULTADO FINAL: ${availableSlots.length} horários disponíveis de ${allSlots.length} possíveis`);
    devLog(`🕐 Horários disponíveis: [${availableSlots.join(', ')}]`);
    devLog(`🚫 Horários ocupados: [${Array.from(occupiedTimes).join(', ')}]`);

    return availableSlots;

  } catch (error: any) {
    devError('❌ Erro ao buscar horários disponíveis:', error);
    return [];
  }
};
