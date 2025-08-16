import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { smartCache } from '@/utils/smartCache';
import { validator, validateBookingForm, BookingFormData } from '@/utils/advancedValidation';
import { devLog, devError, devWarn } from '@/utils/console';
import { debounce } from 'lodash-es';

interface BookingState {
  isLoading: boolean;
  isValidating: boolean;
  isSubmitting: boolean;
  error: string | null;
  validationErrors: Record<string, string>;
  availableTimes: string[];
  lastValidation: Date | null;
}

interface UseOptimizedBookingOptions {
  companyId: string;
  enableRealtime?: boolean;
  cacheTimeout?: number;
  validationDelay?: number;
}

export const useOptimizedBooking = ({
  companyId,
  enableRealtime = true,
  cacheTimeout = 30000,
  validationDelay = 300
}: UseOptimizedBookingOptions) => {
  const [state, setState] = useState<BookingState>({
    isLoading: false,
    isValidating: false,
    isSubmitting: false,
    error: null,
    validationErrors: {},
    availableTimes: [],
    lastValidation: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const realtimeChannelRef = useRef<any>(null);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced validation para melhor UX
  const debouncedValidation = useCallback(
    debounce(async (formData: Partial<BookingFormData>) => {
      setState(prev => ({ ...prev, isValidating: true, validationErrors: {} }));

      try {
        const result = await validateBookingForm(formData);
        
        if (!result.success) {
          const errors: Record<string, string> = {};
          result.errors.forEach(error => {
            const [field, message] = error.split(': ');
            errors[field] = message;
          });
          
          setState(prev => ({
            ...prev,
            validationErrors: errors,
            isValidating: false,
            lastValidation: new Date()
          }));
        } else {
          setState(prev => ({
            ...prev,
            validationErrors: {},
            isValidating: false,
            lastValidation: new Date()
          }));
        }
      } catch (error) {
        devError('❌ Validation error:', error);
        setState(prev => ({
          ...prev,
          isValidating: false,
          error: 'Erro na validação dos dados'
        }));
      }
    }, validationDelay),
    [validationDelay]
  );

  // Carregamento otimizado de horários disponíveis
  const loadAvailableTimes = useCallback(async (
    date: string,
    serviceId?: string,
    forceRefresh = false
  ): Promise<string[]> => {
    if (!date || !companyId) return [];

    const cacheKey = `times_${companyId}_${date}_${serviceId || 'default'}`;
    
    // Cancelar requisição anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Verificar cache primeiro
      if (!forceRefresh) {
        const cached = smartCache.get<string[]>(cacheKey);
        if (cached) {
          setState(prev => ({ ...prev, availableTimes: cached, isLoading: false }));
          return cached;
        }
      }

      devLog('🔄 Loading available times:', { date, serviceId, companyId });

      // Buscar configurações da empresa
      const { data: settings } = await supabase
        .from('company_booking_settings')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (!settings) {
        throw new Error('Configurações da empresa não encontradas');
      }

      // Buscar agendamentos existentes
      const { data: appointments } = await supabase
        .from('appointments')
        .select('appointment_time, service_duration')
        .eq('company_id', companyId)
        .eq('appointment_date', date)
        .in('status', ['confirmed', 'pending']);

      // Gerar horários disponíveis
      const times = generateAvailableSlots(settings, date, appointments || []);
      
      // Salvar no cache
      smartCache.set(cacheKey, times, { ttl: cacheTimeout });

      setState(prev => ({ 
        ...prev, 
        availableTimes: times, 
        isLoading: false 
      }));

      devLog('✅ Available times loaded:', times.length);
      return times;

    } catch (error: unknown) {
      if (error.name === 'AbortError') return [];
      
      devError('❌ Error loading times:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erro ao carregar horários disponíveis'
      }));
      return [];
    }
  }, [companyId, cacheTimeout]);

  // Submissão otimizada com retry automático
  const submitBooking = useCallback(async (
    formData: BookingFormData,
    maxRetries = 3
  ): Promise<{ success: boolean; appointmentId?: string; error?: string }> => {
    setState(prev => ({ ...prev, isSubmitting: true, error: null }));

    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        devLog('🔄 Submitting booking:', { attempt: retryCount + 1, formData });

        // Validação final
        const validation = await validateBookingForm(formData);
        if (!validation.success) {
          return {
            success: false,
            error: validation.errors.join('; ')
          };
        }

        // Verificar disponibilidade em tempo real
        const isAvailable = await checkSlotAvailability(
          companyId,
          formData.selectedDate,
          formData.selectedTime
        );

        if (!isAvailable) {
          return {
            success: false,
            error: 'Horário não está mais disponível'
          };
        }

        // Criar agendamento
        const { data: appointment, error } = await supabase.rpc(
          'create_appointment_with_validation',
          {
            p_company_id: companyId,
            p_client_name: validation.data.clientName,
            p_client_phone: validation.data.clientPhone,
            p_appointment_date: validation.data.selectedDate,
            p_appointment_time: validation.data.selectedTime,
            p_client_email: validation.data.clientEmail || null,
            p_service_id: validation.data.selectedService,
            p_service_duration: 30,
            p_professional_id: validation.data.selectedProfessional || null,
            p_notes: validation.data.notes || null
          }
        );

        if (error) {
          throw error;
        }

        // Invalidar cache de horários
        const cacheKey = `times_${companyId}_${formData.selectedDate}`;
        smartCache.delete(cacheKey);

        // Notificar via Realtime
        await notifyBookingUpdate(companyId, formData.selectedDate);

        setState(prev => ({ ...prev, isSubmitting: false }));

        devLog('✅ Booking submitted successfully:', appointment.id);
        return {
          success: true,
          appointmentId: appointment.id
        };

      } catch (error: unknown) {
        retryCount++;
        devWarn(`⚠️ Booking attempt ${retryCount} failed:`, error);

        if (retryCount >= maxRetries) {
          setState(prev => ({
            ...prev,
            isSubmitting: false,
            error: error.message || 'Erro ao criar agendamento'
          }));

          return {
            success: false,
            error: error.message || 'Erro ao criar agendamento'
          };
        }

        // Aguardar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    return { success: false, error: 'Erro interno' };
  }, [companyId]);

  // Configurar Realtime se habilitado
  useEffect(() => {
    if (!enableRealtime || !companyId) return;

    const channel = supabase.channel(`bookings_${companyId}`);
    
    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `company_id=eq.${companyId}`
      }, (payload) => {
        devLog('📡 Realtime booking update:', payload);
        
        // Invalidar cache relevante
        const date = payload.new?.appointment_date || payload.old?.appointment_date;
        if (date) {
          const cacheKey = `times_${companyId}_${date}`;
          smartCache.delete(cacheKey);
          
          // Recarregar horários se for a data atual
          if (state.availableTimes.length > 0) {
            loadAvailableTimes(date, undefined, true);
          }
        }
      })
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enableRealtime, companyId, loadAvailableTimes, state.availableTimes.length]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      debouncedValidation.cancel();
    };
  }, [debouncedValidation]);

  return {
    // Estado
    ...state,
    
    // Ações
    loadAvailableTimes,
    submitBooking,
    validateForm: debouncedValidation,
    
    // Utilitários
    clearError: useCallback(() => {
      setState(prev => ({ ...prev, error: null }));
    }, []),
    
    clearValidationErrors: useCallback(() => {
      setState(prev => ({ ...prev, validationErrors: {} }));
    }, []),
    
    refreshTimes: useCallback((date: string, serviceId?: string) => {
      return loadAvailableTimes(date, serviceId, true);
    }, [loadAvailableTimes])
  };
};

// Funções auxiliares
const generateAvailableSlots = (
  settings: any,
  date: string,
  existingAppointments: unknown[]
): string[] => {
  const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(date).getDay()];
  const daySettings = settings.opening_hours[dayOfWeek];
  
  if (!daySettings?.active) return [];

  const slots: string[] = [];
  const [openHour, openMinute] = daySettings.open.split(':').map(Number);
  const [closeHour, closeMinute] = daySettings.close.split(':').map(Number);
  
  let currentTime = openHour * 60 + openMinute;
  const closeTime = closeHour * 60 + closeMinute;
  
  while (currentTime < closeTime) {
    const hour = Math.floor(currentTime / 60);
    const minute = currentTime % 60;
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Verificar horário de almoço
    let isLunchTime = false;
    if (settings.lunch_break?.active) {
      const [lunchStartHour, lunchStartMinute] = settings.lunch_break.start.split(':').map(Number);
      const [lunchEndHour, lunchEndMinute] = settings.lunch_break.end.split(':').map(Number);
      
      const lunchStart = lunchStartHour * 60 + lunchStartMinute;
      const lunchEnd = lunchEndHour * 60 + lunchEndMinute;
      
      isLunchTime = currentTime >= lunchStart && currentTime < lunchEnd;
    }
    
    // Verificar conflitos
    const hasConflict = existingAppointments.some(apt => {
      const [appHour, appMinute] = apt.appointment_time.split(':').map(Number);
      const appTime = appHour * 60 + appMinute;
      const duration = apt.service_duration || 30;
      
      return currentTime >= appTime && currentTime < (appTime + duration);
    });
    
    if (!isLunchTime && !hasConflict) {
      slots.push(timeString);
    }
    
    currentTime += settings.slot_interval_minutes;
  }
  
  return slots;
};

const checkSlotAvailability = async (
  companyId: string,
  date: string,
  time: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_slot_availability', {
      p_company_id: companyId,
      p_appointment_date: date,
      p_appointment_time: time,
      p_service_duration: 30
    });

    if (error) throw error;
    return data[0]?.is_available || false;
  } catch (error) {
    devError('❌ Error checking slot availability:', error);
    return false;
  }
};

const notifyBookingUpdate = async (companyId: string, date: string): Promise<void> => {
  try {
    const channel = supabase.channel(`booking_update_${companyId}_${date}`);
    await channel.send({
      type: 'broadcast',
      event: 'booking_updated',
      payload: { companyId, date, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    devWarn('⚠️ Error sending booking notification:', error);
  }
};

export default useOptimizedBooking;