
import { supabase } from '@/integrations/supabase/client';
import { getBrasiliaDate, formatBrazilianDate } from '@/lib/dateConfig';
import { TodayAppointment, RecentAppointment } from '@/types/dashboard';

export const fetchTodayAppointments = async (userId: string): Promise<TodayAppointment[]> => {
  const todayBrasilia = getBrasiliaDate();
  const todayStr = formatBrazilianDate(todayBrasilia).split('/').reverse().join('-');
  
  console.log('Data de hoje (Brasília):', todayBrasilia);
  console.log('Data formatada para busca:', todayStr);
  
  const { data: todayAppts, error } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_time,
      status,
      clients(name, phone),
      services(name)
    `)
    .eq('company_id', userId)
    .eq('appointment_date', todayStr)
    .neq('status', 'cancelled')
    .order('appointment_time');

  if (error) {
    console.error('Erro ao buscar agendamentos de hoje:', error);
    throw error;
  }

  console.log('Agendamentos de hoje encontrados:', todayAppts?.length || 0);
  console.log('Agendamentos de hoje detalhes:', todayAppts);

  return todayAppts?.map(apt => ({
    id: apt.id,
    appointment_time: apt.appointment_time,
    status: apt.status,
    client_name: apt.clients?.name || 'Cliente não encontrado',
    client_phone: apt.clients?.phone || '',
    service_name: apt.services?.name || 'Serviço não encontrado'
  })) || [];
};

export const fetchRecentAppointments = async (userId: string): Promise<RecentAppointment[]> => {
  const { data: recentAppts, error } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_date,
      appointment_time,
      status,
      clients(name, phone),
      services(name)
    `)
    .eq('company_id', userId)
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Erro ao buscar agendamentos recentes:', error);
    throw error;
  }

  console.log('Agendamentos recentes encontrados:', recentAppts?.length || 0);

  return recentAppts?.map(apt => ({
    id: apt.id,
    appointment_date: apt.appointment_date,
    appointment_time: apt.appointment_time,
    status: apt.status,
    client_name: apt.clients?.name || 'Cliente não encontrado',
    client_phone: apt.clients?.phone || '',
    service_name: apt.services?.name || 'Serviço não encontrado'
  })) || [];
};
