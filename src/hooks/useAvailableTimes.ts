
import { useState, useEffect, useCallback, useRef } from 'react';
import { CompanySettings } from '@/types/publicBooking';
import { generateAvailableDates } from '@/utils/dateUtils';
import { getSimpleAvailableTimes } from '@/services/simpleBookingService';
import { supabase } from '@/integrations/supabase/client';
import { subscribeToBookingUpdates } from '@/utils/realtimeBookingSync';
import { devLog } from '@/utils/console';

export const useAvailableTimes = (companySettings: CompanySettings | null) => {
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [nextRefresh, setNextRefresh] = useState<number>(0);
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastLoadRef = useRef<number>(0);

  const generateAvailableDatesForCompany = async () => {
    if (!companySettings) {
      return [];
    }
    
    try {
      // Buscar dias ativos de daily_schedules
      const { data: dailySchedules, error } = await supabase
        .from('daily_schedules')
        .select('day_of_week, is_active')
        .eq('company_id', companySettings.company_id)
        .eq('is_active', true);

      if (error) {
        // Fallback para company_settings
        return generateAvailableDates(companySettings.working_days, companySettings.advance_booking_limit);
      }

      const activeDays = dailySchedules?.map(schedule => schedule.day_of_week) || [];
      
      if (activeDays.length === 0) {
        return generateAvailableDates(companySettings.working_days, companySettings.advance_booking_limit);
      }
      
      return generateAvailableDates(activeDays, companySettings.advance_booking_limit);
      
    } catch (error) {
      return generateAvailableDates(companySettings.working_days, companySettings.advance_booking_limit);
    }
  };

  // Função otimizada para buscar horários
  const loadAvailableTimes = useCallback(async (selectedDate: string, serviceDuration?: number, forceRefresh = false) => {
    if (!companySettings || !selectedDate) {
      setAvailableTimes([]);
      return [];
    }
    
    const now = Date.now();
    
    // Debounce anti-spam
    if (!forceRefresh && now - lastLoadRef.current < 500) {
      devLog('🔄 Debounce ativo - ignorando chamada duplicada');
      return availableTimes;
    }
    
    lastLoadRef.current = now;
    setIsLoading(true);
    setIsSyncing(true);
    
    try {
      devLog(`🔄 [OTIMIZADO-V2] Carregando horários para ${selectedDate}`);
      
      const times = await getSimpleAvailableTimes(
        companySettings.company_id,
        selectedDate,
        serviceDuration || 60
      );

      setAvailableTimes(times);
      setCurrentDate(selectedDate);
      setLastSync(new Date());
      setIsConnected(true);
      
      devLog(`✅ [OTIMIZADO-V2] ${times.length} horários carregados`);
      return times;
      
    } catch (error) {
      devLog('❌ Erro ao carregar horários:', error);
      setAvailableTimes([]);
      setIsConnected(false);
      return [];
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [companySettings, availableTimes]);

  // Contador regressivo otimizado
  const startCountdown = useCallback(() => {
    setNextRefresh(1);
    
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    countdownRef.current = setInterval(() => {
      setNextRefresh(prev => prev <= 1 ? 1 : prev - 1);
    }, 1000);
  }, []);

  // Sincronização em tempo real
  useEffect(() => {
    if (!companySettings || !currentDate) return;

    devLog(`📡 [OTIMIZADO-V2] Configurando sincronização para ${currentDate}`);
    
    // WebSocket subscription
    const unsubscribe = subscribeToBookingUpdates(
      companySettings.company_id,
      currentDate,
      () => {
        devLog(`🔄 [REALTIME] Mudança detectada - recarregando ${currentDate}`);
        setIsSyncing(true);
        loadAvailableTimes(currentDate, undefined, true);
      }
    );

    // Auto-refresh reduzido para 1 segundo
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    refreshIntervalRef.current = setInterval(() => {
      devLog(`⚡ [AUTO-REFRESH] Executando para ${currentDate}`);
      loadAvailableTimes(currentDate, undefined, true);
    }, 1000);

    startCountdown();

    return () => {
      unsubscribe();
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [companySettings, currentDate, loadAvailableTimes, startCountdown]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const refreshTimes = useCallback(() => {
    setIsSyncing(true);
    return loadAvailableTimes(currentDate, undefined, true);
  }, [currentDate, loadAvailableTimes]);

  return {
    generateAvailableDates: generateAvailableDatesForCompany,
    generateAvailableTimes: loadAvailableTimes,
    availableTimes,
    isLoading,
    refreshTimes,
    isConnected,
    isSyncing,
    lastSync,
    nextRefresh
  };
};
