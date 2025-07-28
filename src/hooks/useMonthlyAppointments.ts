
import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { getStorageData, MockAppointment, MockClient, MockService, STORAGE_KEYS } from '@/data/mockData';

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
      
      const appointmentData = getStorageData<MockAppointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
      const clients = getStorageData<MockClient[]>(STORAGE_KEYS.CLIENTS, []);
      const services = getStorageData<MockService[]>(STORAGE_KEYS.SERVICES, []);

      // Filtrar agendamentos do mês e da empresa
      const monthlyAppointments = appointmentData.filter(apt => 
        apt.company_id === user.id &&
        apt.appointment_date >= startDate &&
        apt.appointment_date <= endDate
      );

      console.log('Agendamentos encontrados:', monthlyAppointments.length);

      const processedAppointments: Appointment[] = monthlyAppointments.map(apt => {
        const client = clients.find(c => c.id === apt.client_id);
        const service = services.find(s => s.id === apt.service_id);

        return {
          id: apt.id,
          appointment_date: apt.appointment_date,
          appointment_time: apt.appointment_time,
          client_name: client?.name || 'Cliente não encontrado',
          client_phone: client?.phone || '',
          service_name: service?.name || 'Serviço não encontrado',
          status: apt.status
        };
      });

      // Ordenar por data e hora
      processedAppointments.sort((a, b) => {
        const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
        const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
        return dateA.getTime() - dateB.getTime();
      });

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
