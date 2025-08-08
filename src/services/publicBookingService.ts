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
 */
let timeSlotsCache: { [key: string]: { data: string[], timestamp: number } } = {};
const CACHE_DURATION = 30000; // 30 segundos

/**
 * Invalida o cache de horários para uma data específica
 */
export const invalidateTimeSlotsCache = (companyId: string, date?: string) => {
  if (date) {
    const cacheKey = `${companyId}-${date}`;
    delete timeSlotsCache[cacheKey];
  } else {
    // Invalidar todo o cache da empresa
    Object.keys(timeSlotsCache).forEach(key => {
      if (key.startsWith(companyId)) {
        delete timeSlotsCache[key];
      }
    });
  }
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
  // Verificar cache primeiro
  const cacheKey = `${companyId}-${selectedDate}-${serviceDuration || 60}`;
  const cached = timeSlotsCache[cacheKey];
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
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

    // ETAPA 4: Buscar agendamentos (simplificado)
    const { data: bookedAppointments } = await supabase
      .from('appointments')
      .select('appointment_time, duration, status')
      .eq('company_id', companyId)
      .eq('appointment_date', selectedDate)
      .in('status', ['confirmed', 'completed']);

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

    // Armazenar no cache
    timeSlotsCache[cacheKey] = {
      data: availableSlots,
      timestamp: now
    };

    return availableSlots;

  } catch (error: any) {
    return [];
  }
};