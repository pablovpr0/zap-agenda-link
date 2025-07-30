
import { supabase } from '@/integrations/supabase/client';
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
  
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_time,
      duration,
      status,
      clients!inner(name, phone),
      services!inner(name)
    `)
    .eq('company_id', userId)
    .eq('appointment_date', today)
    .neq('status', 'cancelled')
    .order('appointment_time');

  if (error) {
    console.error('Erro ao buscar agendamentos de hoje:', error);
    return [];
  }

  const todayAppointments = (appointments || []).map(appointment => ({
    id: appointment.id,
    client_name: appointment.clients?.name || 'Cliente não encontrado',
    client_phone: appointment.clients?.phone || '',
    service_name: appointment.services?.name || 'Serviço não encontrado',
    appointment_time: appointment.appointment_time,
    duration: appointment.duration,
    status: appointment.status
  }));

  console.log('Agendamentos de hoje encontrados:', todayAppointments.length);
  return todayAppointments;
};

export const fetchRecentAppointments = async (userId: string): Promise<RecentAppointment[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_date,
      appointment_time,
      status,
      clients!inner(name),
      services!inner(name)
    `)
    .eq('company_id', userId)
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Erro ao buscar agendamentos recentes:', error);
    return [];
  }

  const recentAppointments = (appointments || []).map(appointment => ({
    id: appointment.id,
    client_name: appointment.clients?.name || 'Cliente não encontrado',
    service_name: appointment.services?.name || 'Serviço não encontrado',
    appointment_date: appointment.appointment_date,
    appointment_time: appointment.appointment_time,
    status: appointment.status
  }));

  console.log('Agendamentos recentes encontrados:', recentAppointments.length);
  return recentAppointments;
};
