
import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  client_name: string;
  client_phone: string;
  service_name: string;
  status: string;
}

export const useMonthlyAppointments = (currentDate: Date) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user, currentDate]);

  const loadAppointments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const startDate = format(monthStart, 'yyyy-MM-dd');
      const endDate = format(monthEnd, 'yyyy-MM-dd');
      
      devLog('Carregando agendamentos para o período:', startDate, 'até', endDate);
      
      const { data: appointmentData, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          clients!inner(name, phone),
          services!inner(name)
        `)
        .eq('company_id', user.id)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .order('appointment_date')
        .order('appointment_time');

      if (error) {
        devError('Erro ao carregar agendamentos:', error);
        setAppointments([]);
        return;
      }

      devLog('Agendamentos encontrados:', appointmentData?.length || 0);

      const processedAppointments: Appointment[] = (appointmentData || []).map(apt => ({
        id: apt.id,
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        client_name: apt.clients?.name || 'Cliente não encontrado',
        client_phone: apt.clients?.phone || '',
        service_name: apt.services?.name || 'Serviço não encontrado',
        status: apt.status
      }));

      setAppointments(processedAppointments);
      devLog('Total de agendamentos processados:', processedAppointments.length);

    } catch (error) {
      devError('Erro ao carregar agendamentos:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(apt => apt.appointment_date === dateStr);
  };

  return {
    appointments,
    loading,
    getAppointmentsForDate,
    refreshAppointments: loadAppointments
  };
};
