
import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
      
      console.log('Carregando agendamentos para o período:', startDate, 'até', endDate);
      
      const { data: appointmentData, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          client_id,
          service_id
        `)
        .eq('company_id', user.id)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .order('appointment_date')
        .order('appointment_time');

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        throw error;
      }

      console.log('Agendamentos encontrados:', appointmentData?.length || 0);

      const processedAppointments: Appointment[] = [];
      
      if (appointmentData && appointmentData.length > 0) {
        for (const apt of appointmentData) {
          try {
            const { data: clientData } = await supabase
              .from('clients')
              .select('name, phone')
              .eq('id', apt.client_id)
              .single();

            const { data: serviceData } = await supabase
              .from('services')
              .select('name')
              .eq('id', apt.service_id)
              .single();

            processedAppointments.push({
              id: apt.id,
              appointment_date: apt.appointment_date,
              appointment_time: apt.appointment_time,
              client_name: clientData?.name || 'Cliente não encontrado',
              client_phone: clientData?.phone || '',
              service_name: serviceData?.name || 'Serviço não encontrado',
              status: apt.status
            });

          } catch (procError) {
            console.error('Erro ao processar agendamento:', apt.id, procError);
            processedAppointments.push({
              id: apt.id,
              appointment_date: apt.appointment_date,
              appointment_time: apt.appointment_time,
              client_name: 'Cliente não encontrado',
              client_phone: '',
              service_name: 'Serviço não encontrado',
              status: apt.status
            });
          }
        }
      }

      setAppointments(processedAppointments);
      console.log('Total de agendamentos processados:', processedAppointments.length);

    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
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
