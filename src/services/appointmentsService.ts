import { getStorageData, MockAppointment, MockClient, MockService, STORAGE_KEYS } from '@/data/mockData';
import { format } from 'date-fns';

interface TodayAppointment {
  id: string;
  client_name: string;
  client_phone: string;
  service_name: string;
  appointment_time: string;
  duration: number;
  status: string;
}

interface RecentAppointment {
  id: string;
  client_name: string;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
}

export const fetchTodayAppointments = async (userId: string): Promise<TodayAppointment[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const today = format(new Date(), 'yyyy-MM-dd');
  
  const appointments = getStorageData<MockAppointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
  const clients = getStorageData<MockClient[]>(STORAGE_KEYS.CLIENTS, []);
  const services = getStorageData<MockService[]>(STORAGE_KEYS.SERVICES, []);

  const todayAppointments = appointments
    .filter(appointment => 
      appointment.company_id === userId &&
      appointment.appointment_date === today &&
      appointment.status !== 'cancelled'
    )
    .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
    .map(appointment => {
      const client = clients.find(c => c.id === appointment.client_id);
      const service = services.find(s => s.id === appointment.service_id);
      
      return {
        id: appointment.id,
        client_name: client?.name || 'Cliente não encontrado',
        client_phone: client?.phone || '',
        service_name: service?.name || 'Serviço não encontrado',
        appointment_time: appointment.appointment_time,
        duration: appointment.duration,
        status: appointment.status
      };
    });

  console.log('Agendamentos de hoje encontrados:', todayAppointments.length);
  return todayAppointments;
};

export const fetchRecentAppointments = async (userId: string): Promise<RecentAppointment[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const appointments = getStorageData<MockAppointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
  const clients = getStorageData<MockClient[]>(STORAGE_KEYS.CLIENTS, []);
  const services = getStorageData<MockService[]>(STORAGE_KEYS.SERVICES, []);

  const recentAppointments = appointments
    .filter(appointment => appointment.company_id === userId)
    .sort((a, b) => {
      const dateA = new Date(a.appointment_date + ' ' + a.appointment_time);
      const dateB = new Date(b.appointment_date + ' ' + b.appointment_time);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5)
    .map(appointment => {
      const client = clients.find(c => c.id === appointment.client_id);
      const service = services.find(s => s.id === appointment.service_id);
      
      return {
        id: appointment.id,
        client_name: client?.name || 'Cliente não encontrado',
        service_name: service?.name || 'Serviço não encontrado',
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        status: appointment.status
      };
    });

  console.log('Agendamentos recentes encontrados:', recentAppointments.length);
  return recentAppointments;
};