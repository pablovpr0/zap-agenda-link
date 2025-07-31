import { supabase } from '@/integrations/supabase/client';

export interface DailyRevenue {
  date: string;
  totalRevenue: number;
  appointmentsCount: number;
  cancelledRevenue: number;
  netRevenue: number;
  appointments: Array<{
    id: string;
    clientName: string;
    serviceName: string;
    servicePrice: number;
    status: string;
    appointmentTime: string;
  }>;
}

export const calculateDailyRevenue = async (
  companyId: string,
  date: string
): Promise<DailyRevenue> => {
  try {
    // Buscar todos os agendamentos do dia com informações de serviço e cliente
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        status,
        appointment_time,
        clients!inner(name),
        services!inner(name, price)
      `)
      .eq('company_id', companyId)
      .eq('appointment_date', date)
      .order('appointment_time');

    if (error) {
      console.error('Erro ao buscar agendamentos para receita:', error);
      throw error;
    }

    let totalRevenue = 0;
    let cancelledRevenue = 0;
    let appointmentsCount = 0;
    const appointmentDetails: DailyRevenue['appointments'] = [];

    appointments?.forEach(appointment => {
      const servicePrice = appointment.services?.price || 0;
      const clientName = appointment.clients?.name || 'Cliente';
      const serviceName = appointment.services?.name || 'Serviço';

      appointmentDetails.push({
        id: appointment.id,
        clientName,
        serviceName,
        servicePrice: Number(servicePrice),
        status: appointment.status,
        appointmentTime: appointment.appointment_time
      });

      // Apenas agendamentos concluídos geram receita real
      if (appointment.status === 'completed') {
        totalRevenue += Number(servicePrice);
        appointmentsCount++;
      } else if (appointment.status === 'cancelled') {
        cancelledRevenue += Number(servicePrice);
      }
    });

    const netRevenue = totalRevenue;

    return {
      date,
      totalRevenue,
      appointmentsCount,
      cancelledRevenue,
      netRevenue,
      appointments: appointmentDetails
    };

  } catch (error) {
    console.error('Erro ao calcular receita diária:', error);
    throw error;
  }
};

export const calculateMonthlyRevenue = async (
  companyId: string,
  year: number,
  month: number
): Promise<{
  totalRevenue: number;
  totalAppointments: number;
  averageDailyRevenue: number;
  dailyBreakdown: DailyRevenue[];
}> => {
  try {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

    // Buscar todos os agendamentos do mês
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        status,
        appointment_time,
        clients!inner(name),
        services!inner(name, price)
      `)
      .eq('company_id', companyId)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)
      .order('appointment_date, appointment_time');

    if (error) {
      console.error('Erro ao buscar agendamentos mensais:', error);
      throw error;
    }

    // Agrupar por data
    const dailyData: { [key: string]: DailyRevenue } = {};
    let totalRevenue = 0;
    let totalAppointments = 0;

    appointments?.forEach(appointment => {
      const date = appointment.appointment_date;
      const servicePrice = appointment.services?.price || 0;
      const clientName = appointment.clients?.name || 'Cliente';
      const serviceName = appointment.services?.name || 'Serviço';

      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          totalRevenue: 0,
          appointmentsCount: 0,
          cancelledRevenue: 0,
          netRevenue: 0,
          appointments: []
        };
      }

      dailyData[date].appointments.push({
        id: appointment.id,
        clientName,
        serviceName,
        servicePrice: Number(servicePrice),
        status: appointment.status,
        appointmentTime: appointment.appointment_time
      });

      // Apenas agendamentos concluídos geram receita real
      if (appointment.status === 'completed') {
        dailyData[date].totalRevenue += Number(servicePrice);
        dailyData[date].appointmentsCount++;
        totalRevenue += Number(servicePrice);
        totalAppointments++;
      } else if (appointment.status === 'cancelled') {
        dailyData[date].cancelledRevenue += Number(servicePrice);
      }

      dailyData[date].netRevenue = dailyData[date].totalRevenue;
    });

    const dailyBreakdown = Object.values(dailyData);
    const daysWithRevenue = dailyBreakdown.filter(day => day.totalRevenue > 0).length;
    const averageDailyRevenue = daysWithRevenue > 0 ? totalRevenue / daysWithRevenue : 0;

    return {
      totalRevenue,
      totalAppointments,
      averageDailyRevenue,
      dailyBreakdown
    };

  } catch (error) {
    console.error('Erro ao calcular receita mensal:', error);
    throw error;
  }
};

export const updateAppointmentStatus = async (
  appointmentId: string,
  newStatus: 'confirmed' | 'cancelled' | 'completed'
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    if (error) {
      console.error('Erro ao atualizar status do agendamento:', error);
      throw error;
    }

    console.log(`Status do agendamento ${appointmentId} atualizado para ${newStatus}`);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    throw error;
  }
};