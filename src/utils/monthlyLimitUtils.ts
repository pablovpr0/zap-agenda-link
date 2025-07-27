import { getStorageData, MockAppointment, MockClient, STORAGE_KEYS } from '@/data/mockData';

export const checkMonthlyLimit = async (
  companyId: string,
  clientPhone: string,
  monthlyAppointmentsLimit?: number
) => {
  if (!monthlyAppointmentsLimit) {
    console.log('Limite mensal não configurado, permitindo agendamento');
    return true;
  }

  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const startOfMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const startOfNextMonth = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
    
    console.log(`Verificando limite mensal para cliente ${clientPhone}`);
    console.log(`Período: ${startOfMonth} até ${startOfNextMonth}`);
    console.log(`Limite configurado: ${monthlyAppointmentsLimit}`);
    
    const appointments = getStorageData<MockAppointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    const clients = getStorageData<MockClient[]>(STORAGE_KEYS.CLIENTS, []);
    
    // Find client by phone
    const client = clients.find(c => c.phone === clientPhone && c.company_id === companyId);
    if (!client) {
      return true; // New client, allow booking
    }

    const monthlyAppointments = appointments.filter(appointment =>
      appointment.company_id === companyId &&
      appointment.client_id === client.id &&
      appointment.appointment_date >= startOfMonth &&
      appointment.appointment_date < startOfNextMonth &&
      appointment.status !== 'cancelled'
    );

    const appointmentCount = monthlyAppointments.length;
    console.log(`Cliente ${clientPhone} tem ${appointmentCount} agendamentos confirmados este mês`);
    
    const canBook = appointmentCount < monthlyAppointmentsLimit;
    console.log(`Pode agendar: ${canBook}`);
    
    return canBook;
  } catch (error) {
    console.error('Erro ao verificar limite mensal:', error);
    return true;
  }
};