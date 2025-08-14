
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { devLog, devError } from '@/utils/console';

interface BookingLimits {
  canBook: boolean;
  simultaneousLimit: {
    canBook: boolean;
    currentCount: number;
    limit: number;
    message?: string;
  };
  monthlyLimit: {
    canBook: boolean;
    currentCount: number;
    limit: number;
    message?: string;
  };
  isAdmin: boolean;
}

export const useBookingLimitsCheck = (companyId: string, clientPhone: string) => {
  const [limits, setLimits] = useState<BookingLimits | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<number>(0);

  const checkLimits = useCallback(async (force = false) => {
    if (!companyId || !clientPhone) return;

    const now = Date.now();
    // Cache por 30 segundos, a menos que forçado
    if (!force && now - lastCheck < 30000 && limits) {
      return limits;
    }

    setIsLoading(true);
    try {
      devLog('🔍 Verificando limites para cliente:', clientPhone);
      
      const { data, error } = await supabase.functions.invoke('validate-booking-limits', {
        body: { companyId, clientPhone }
      });

      if (error) {
        devError('❌ Erro ao verificar limites:', error);
        return null;
      }

      const limitsData: BookingLimits = {
        canBook: data.canBook,
        simultaneousLimit: data.simultaneousLimit,
        monthlyLimit: data.monthlyLimit,
        isAdmin: data.isAdmin
      };

      setLimits(limitsData);
      setLastCheck(now);
      
      devLog('✅ Limites verificados:', limitsData);
      return limitsData;

    } catch (error) {
      devError('❌ Erro na verificação de limites:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [companyId, clientPhone, lastCheck, limits]);

  // Verificação inicial e periódica
  useEffect(() => {
    checkLimits();
    
    // Verificar a cada 15 segundos
    const interval = setInterval(() => {
      checkLimits();
    }, 15000);

    return () => clearInterval(interval);
  }, [checkLimits]);

  const refreshLimits = useCallback(() => {
    return checkLimits(true);
  }, [checkLimits]);

  return {
    limits,
    isLoading,
    refreshLimits,
    lastCheck: new Date(lastCheck)
  };
};
