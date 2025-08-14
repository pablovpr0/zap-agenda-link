
import { useState, useEffect, useCallback } from 'react';
import { CompanySettings } from '@/types/publicBooking';
import { generateAvailableDates, generateTimeSlots } from '@/utils/dateUtils';
import { checkAvailableTimes } from '@/services/publicBookingService';
import { getSimpleAvailableTimes } from '@/services/simpleBookingService';
import { supabase } from '@/integrations/supabase/client';
import { subscribeToBookingUpdates } from '@/utils/realtimeBookingSync';
import { devLog } from '@/utils/console';

export const useAvailableTimes = (companySettings: CompanySettings | null) => {
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('');

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

  // Função para buscar horários com sincronização em tempo real
  const loadAvailableTimes = useCallback(async (selectedDate: string, serviceDuration?: number, forceRefresh = false) => {
    if (!companySettings || !selectedDate) {
      setAvailableTimes([]);
      return [];
    }
    
    setIsLoading(true);
    setCurrentDate(selectedDate);
    
    try {
      devLog(`🔄 Carregando horários para ${selectedDate} (force: ${forceRefresh})`);
      
      // USAR VERSÃO SIMPLES PARA TESTE
      const times = await getSimpleAvailableTimes(
        companySettings.company_id,
        selectedDate
      );

      setAvailableTimes(times);
      return times;
      
    } catch (error) {
      devLog('❌ Erro ao carregar horários:', error);
      setAvailableTimes([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [companySettings]);

  // Configurar sincronização em tempo real + refresh automático
  useEffect(() => {
    if (!companySettings || !currentDate) return;

    devLog(`📡 Configurando sincronização para ${currentDate}`);
    
    const unsubscribe = subscribeToBookingUpdates(
      companySettings.company_id,
      currentDate,
      () => {
        devLog(`🔄 Sincronização ativada - recarregando horários para ${currentDate}`);
        loadAvailableTimes(currentDate, undefined, true); // Force refresh
      }
    );

    // Refresh automático a cada 2 segundos para resposta instantânea
    const autoRefresh = setInterval(() => {
      devLog(`⚡ Auto-refresh executado para ${currentDate}`);
      loadAvailableTimes(currentDate, undefined, true);
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(autoRefresh);
    };
  }, [companySettings, currentDate, loadAvailableTimes]);

  return {
    generateAvailableDates: generateAvailableDatesForCompany,
    generateAvailableTimes: loadAvailableTimes,
    availableTimes,
    isLoading,
    refreshTimes: () => loadAvailableTimes(currentDate, undefined, true)
  };
};
