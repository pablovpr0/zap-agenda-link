import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { devLog, devError } from '@/utils/console';

interface BookingLimits {
  canBook: boolean;
  isAdmin: boolean;
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
}

export const useBookingValidation = () => {
  const [isValidating, setIsValidating] = useState(false);

  const validateBookingLimits = async (
    companyId: string,
    clientPhone: string
  ): Promise<BookingLimits | null> => {
    setIsValidating(true);
    
    try {
      devLog('🔍 Validando limites de agendamento...', { companyId, clientPhone });
      
      const { data, error } = await supabase.functions.invoke('validate-booking-limits', {
        body: {
          companyId,
          clientPhone
        }
      });

      if (error) {
        devError('❌ Erro ao validar limites:', error);
        throw error;
      }

      devLog('✅ Validação concluída:', data);
      return data as BookingLimits;

    } catch (error) {
      devError('❌ Erro na validação de limites:', error);
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validateBookingLimits,
    isValidating
  };
};