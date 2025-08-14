
import { supabase } from '@/integrations/supabase/client';
import { getTodayInBrazil, getCurrentTimeInBrazil } from '@/utils/timezone';
import { devLog, devError } from '@/utils/console';

// Cache em memória com timestamp
const memoryCache = new Map<string, { data: string[], timestamp: number }>();
const CACHE_DURATION = 10000; // 10 segundos para cache em memória

/**
 * VERSÃO ULTRA OTIMIZADA - COM CACHE INTELIGENTE E TIMEZONE CORRETO DO BRASIL
 * Cache de múltiplas camadas: memória + sessionStorage + Supabase
 */
export const getSimpleAvailableTimes = async (
  companyId: string,
  selectedDate: string
): Promise<string[]> => {
  const cacheKey = `${companyId}-${selectedDate}`;
  const now = Date.now();
  
  devLog(`🔄 [CACHE-OTIMIZADO] Buscando horários para ${companyId} em ${selectedDate}`);

  try {
    // NÍVEL 1: Cache em memória (10 segundos)
    const memoryEntry = memoryCache.get(cacheKey);
    if (memoryEntry && (now - memoryEntry.timestamp) < CACHE_DURATION) {
      devLog(`⚡ [MEMORY-CACHE] Cache hit - dados de ${Math.round((now - memoryEntry.timestamp) / 1000)}s atrás`);
      return memoryEntry.data;
    }

    // NÍVEL 2: Cache sessionStorage (30 segundos)
    const sessionData = sessionStorage.getItem(cacheKey);
    const sessionTime = sessionStorage.getItem(`${cacheKey}-time`);
    
    if (sessionData && sessionTime) {
      const sessionAge = now - parseInt(sessionTime);
      if (sessionAge < 30000) { // 30 segundos
        const data = JSON.parse(sessionData);
        // Atualizar cache em memória
        memoryCache.set(cacheKey, { data, timestamp: parseInt(sessionTime) });
        devLog(`📋 [SESSION-CACHE] Cache hit - dados de ${Math.round(sessionAge / 1000)}s atrás`);
        return data;
      }
    }

    // NÍVEL 3: Buscar dados frescos
    devLog(`🔍 [FRESH-DATA] Buscando dados frescos para ${selectedDate}`);

    // 1. Verificar se a data não é passada (usando timezone do Brasil)
    const today = getTodayInBrazil();
    if (selectedDate < today) {
      devLog(`❌ [BRASIL] Data ${selectedDate} é anterior a hoje (${today})`);
      return [];
    }

    // 2. Buscar configuração do dia da semana com otimização
    const date = new Date(selectedDate + 'T12:00:00');
    const dayOfWeek = date.getDay();

    devLog(`📅 [BRASIL] Verificando dia da semana: ${dayOfWeek}`);

    const { data: schedule } = await supabase
      .from('daily_schedules')
      .select('start_time, end_time, is_active')
      .eq('company_id', companyId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single();

    if (!schedule) {
      devLog(`❌ [BRASIL] Nenhuma configuração ativa para o dia ${dayOfWeek}`);
      // Cache resultado vazio por 60 segundos
      const emptyResult: string[] = [];
      memoryCache.set(cacheKey, { data: emptyResult, timestamp: now });
      sessionStorage.setItem(cacheKey, JSON.stringify(emptyResult));
      sessionStorage.setItem(`${cacheKey}-time`, now.toString());
      return emptyResult;
    }

    devLog(`✅ [BRASIL] Horário de funcionamento: ${schedule.start_time} - ${schedule.end_time}`);

    // 3. Buscar TODOS os agendamentos não cancelados para a data (com cache de query)
    const { data: appointments } = await supabase
      .from('appointments')
      .select('appointment_time, status')
      .eq('company_id', companyId)
      .eq('appointment_date', selectedDate)
      .neq('status', 'cancelled');

    devLog(`📋 [BRASIL] Agendamentos encontrados: ${appointments?.length || 0}`);

    // 4. Criar lista de horários ocupados otimizada
    const occupiedTimes = new Set<string>();
    if (appointments) {
      appointments.forEach(apt => {
        // Converter "09:00:00" para "09:00"
        const timeSlot = apt.appointment_time.substring(0, 5);
        occupiedTimes.add(timeSlot);
        devLog(`🚫 [BRASIL] Horário ocupado: ${timeSlot} (${apt.status})`);
      });
    }

    // 5. Gerar todos os slots de 30 em 30 minutos (algoritmo otimizado)
    const availableSlots: string[] = [];
    const [startHour, startMin] = schedule.start_time.split(':').map(Number);
    const [endHour, endMin] = schedule.end_time.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Se for hoje, obter hora atual no horário do Brasil
    let currentMinutes = 0;
    if (selectedDate === today) {
      try {
        const currentTime = getCurrentTimeInBrazil();
        const [currentHour, currentMin] = currentTime.split(':').map(Number);
        currentMinutes = currentHour * 60 + currentMin;
        devLog(`⏰ [BRASIL] Hora atual no Brasil: ${currentTime} (${currentMinutes} minutos)`);
      } catch (error) {
        devLog(`⚠️ [BRASIL] Não foi possível obter hora atual`);
      }
    }

    // Gerar slots com buffer otimizado
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      // Pular horários passados se for hoje (com margem de 30 minutos)
      if (selectedDate === today && minutes <= currentMinutes + 30) {
        continue;
      }

      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const timeSlot = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

      // Verificar se não está ocupado
      if (!occupiedTimes.has(timeSlot)) {
        availableSlots.push(timeSlot);
      }
    }

    devLog(`🎯 [CACHE-OTIMIZADO] RESULTADO: ${availableSlots.length} horários disponíveis`);
    devLog(`🕐 [CACHE-OTIMIZADO] Horários: [${availableSlots.join(', ')}]`);

    // Atualizar todos os níveis de cache
    memoryCache.set(cacheKey, { data: availableSlots, timestamp: now });
    sessionStorage.setItem(cacheKey, JSON.stringify(availableSlots));
    sessionStorage.setItem(`${cacheKey}-time`, now.toString());

    // Limpeza automática do cache em memória (evitar vazamentos)
    if (memoryCache.size > 50) {
      const oldestKey = memoryCache.keys().next().value;
      memoryCache.delete(oldestKey);
    }

    return availableSlots;

  } catch (error) {
    devError('❌ [CACHE-OTIMIZADO] Erro:', error);
    
    // Em caso de erro, tentar usar cache expirado como fallback
    const memoryEntry = memoryCache.get(cacheKey);
    if (memoryEntry) {
      devLog(`🆘 [FALLBACK] Usando cache expirado como fallback`);
      return memoryEntry.data;
    }
    
    return [];
  }
};

/**
 * Função para limpar cache específico
 */
export const clearCacheForDate = (companyId: string, selectedDate: string) => {
  const cacheKey = `${companyId}-${selectedDate}`;
  
  // Limpar cache em memória
  memoryCache.delete(cacheKey);
  
  // Limpar sessionStorage
  sessionStorage.removeItem(cacheKey);
  sessionStorage.removeItem(`${cacheKey}-time`);
  
  devLog(`🧹 [CACHE-CLEAR] Cache limpo para ${cacheKey}`);
};

/**
 * Função para limpar todo o cache de uma empresa
 */
export const clearCompanyCache = (companyId: string) => {
  // Limpar cache em memória
  for (const key of memoryCache.keys()) {
    if (key.startsWith(companyId)) {
      memoryCache.delete(key);
    }
  }
  
  // Limpar sessionStorage
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith(companyId)) {
      sessionStorage.removeItem(key);
      sessionStorage.removeItem(`${key}-time`);
    }
  }
  
  devLog(`🧹 [CACHE-CLEAR] Todo cache da empresa ${companyId} limpo`);
};
