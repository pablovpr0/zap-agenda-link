
import { supabase } from '@/integrations/supabase/client';
import { getTodayInBrazil, getCurrentTimeInBrazil } from '@/utils/timezone';
import { getAvailableTimesOnly } from '@/services/availableTimesService';
import { devLog, devError } from '@/utils/console';

// Cache otimizado com timestamp
const memoryCache = new Map<string, { data: string[], timestamp: number }>();
const CACHE_DURATION = 10000; // 10 segundos

/**
 * VERSÃO ULTRA OTIMIZADA usando novo sistema de horários disponíveis
 */
export const getSimpleAvailableTimes = async (
  companyId: string,
  selectedDate: string,
  serviceDuration: number = 60
): Promise<string[]> => {
  const cacheKey = `${companyId}-${selectedDate}-${serviceDuration}`;
  const now = Date.now();
  
  devLog(`🔄 [OTIMIZADO-V2] Buscando horários para ${companyId} em ${selectedDate} (${serviceDuration}min)`);

  try {
    // NÍVEL 1: Cache em memória
    const memoryEntry = memoryCache.get(cacheKey);
    if (memoryEntry && (now - memoryEntry.timestamp) < CACHE_DURATION) {
      devLog(`⚡ [MEMORY-CACHE] Hit - ${Math.round((now - memoryEntry.timestamp) / 1000)}s`);
      return memoryEntry.data;
    }

    // NÍVEL 2: Cache sessionStorage
    const sessionData = sessionStorage.getItem(cacheKey);
    const sessionTime = sessionStorage.getItem(`${cacheKey}-time`);
    
    if (sessionData && sessionTime) {
      const sessionAge = now - parseInt(sessionTime);
      if (sessionAge < 30000) { // 30 segundos
        const data = JSON.parse(sessionData);
        memoryCache.set(cacheKey, { data, timestamp: parseInt(sessionTime) });
        devLog(`📋 [SESSION-CACHE] Hit - ${Math.round(sessionAge / 1000)}s`);
        return data;
      }
    }

    // NÍVEL 3: Dados frescos usando novo serviço
    devLog(`🔍 [FRESH-DATA-V2] Buscando dados frescos`);

    // Verificar se a data não é passada
    const today = getTodayInBrazil();
    if (selectedDate < today) {
      devLog(`❌ Data ${selectedDate} é anterior a hoje (${today})`);
      return [];
    }

    // Usar o novo serviço otimizado de horários disponíveis
    const availableTimes = await getAvailableTimesOnly(
      companyId, 
      selectedDate, 
      serviceDuration
    );

    devLog(`🎯 [OTIMIZADO-V2] RESULTADO: ${availableTimes.length} horários`);
    devLog(`🕐 Horários: [${availableTimes.join(', ')}]`);

    // Atualizar todos os níveis de cache
    memoryCache.set(cacheKey, { data: availableTimes, timestamp: now });
    sessionStorage.setItem(cacheKey, JSON.stringify(availableTimes));
    sessionStorage.setItem(`${cacheKey}-time`, now.toString());

    // Limpeza automática do cache
    if (memoryCache.size > 50) {
      const oldestKey = memoryCache.keys().next().value;
      memoryCache.delete(oldestKey);
    }

    return availableTimes;

  } catch (error) {
    devError('❌ [OTIMIZADO-V2] Erro:', error);
    
    // Fallback para cache expirado
    const memoryEntry = memoryCache.get(cacheKey);
    if (memoryEntry) {
      devLog(`🆘 [FALLBACK] Usando cache expirado`);
      return memoryEntry.data;
    }
    
    return [];
  }
};

/**
 * Função para limpar cache específico
 */
export const clearCacheForDate = (companyId: string, selectedDate: string, serviceDuration: number = 60) => {
  const cacheKey = `${companyId}-${selectedDate}-${serviceDuration}`;
  
  memoryCache.delete(cacheKey);
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
