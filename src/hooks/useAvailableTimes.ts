
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
      // Get active days from daily_schedules
      const { data: dailySchedules, error } = await supabase
        .from('daily_schedules')
        .select('day_of_week, is_active')
        .eq('company_id', companySettings.company_id)
        .eq('is_active', true);

      if (error) {
        // Fallback to company_settings working_days
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

  const loadAvailableTimes = useCallback(async (selectedDate: string, serviceDuration?: number, forceRefresh = false) => {
    if (!companySettings || !selectedDate) {
      setAvailableTimes([]);
      return [];
    }
    
    const now = Date.now();
    
    if (!forceRefresh && now - lastLoadRef.current < 500) {
      return availableTimes;
    }
    
    lastLoadRef.current = now;
    setIsLoading(true);
    setIsSyncing(true);
    
    try {
      const cacheKey = `${companySettings.company_id}-${selectedDate}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      const cacheTime = sessionStorage.getItem(`${cacheKey}-time`);
      
      if (!forceRefresh && cachedData && cacheTime) {
        const cacheAge = now - parseInt(cacheTime);
        if (cacheAge < 30000) {
          const times = JSON.parse(cachedData);
          setAvailableTimes(times);
          setLastSync(new Date());
          return times;
        }
      }

      const times = await getSimpleAvailableTimes(companySettings.company_id, selectedDate);

      sessionStorage.setItem(cacheKey, JSON.stringify(times));
      sessionStorage.setItem(`${cacheKey}-time`, now.toString());

      setAvailableTimes(times);
      setCurrentDate(selectedDate);
      setLastSync(new Date());
      setIsConnected(true);
      
      return times;
      
    } catch (error) {
      setAvailableTimes([]);
      setIsConnected(false);
      return [];
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [companySettings, availableTimes]);

  const startCountdown = useCallback(() => {
    setNextRefresh(30);
    
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    countdownRef.current = setInterval(() => {
      setNextRefresh(prev => prev <= 1 ? 30 : prev - 1);
    }, 1000);
  }, []);

  useEffect(() => {
    if (!companySettings || !currentDate) return;
    
    const unsubscribe = subscribeToBookingUpdates(
      companySettings.company_id,
      currentDate,
      () => {
        setIsSyncing(true);
        loadAvailableTimes(currentDate, undefined, true);
      }
    );

    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    
    refreshIntervalRef.current = setInterval(() => {
      loadAvailableTimes(currentDate, undefined, true);
    }, 30000); // Otimizado para 30 segundos

    startCountdown();

    return () => {
      unsubscribe();
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [companySettings, currentDate, loadAvailableTimes, startCountdown]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
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
    // Novos estados para UI
    isConnected,
    isSyncing,
    lastSync,
    nextRefresh
  };
};
