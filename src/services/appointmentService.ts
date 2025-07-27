
import { BookingFormData, CompanySettings, Service } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';
import { formatAppointmentDate } from '@/utils/dateUtils';
import { 
  getStorageData, 
  setStorageData, 
  MockClient, 
  MockAppointment, 
  STORAGE_KEYS 
} from '@/data/mockData';

export const createAppointment = async (
  formData: BookingFormData,
  companySettings: CompanySettings,
  services: Service[],
  professionals: Professional[]
) => {
  const { selectedService, selectedProfessional, selectedDate, selectedTime, clientName, clientPhone } = formData;

  // Validação explícita do company_id
  if (!companySettings?.company_id) {
    console.error('🚫 Erro: company_id não encontrado em companySettings');
    throw new Error('Configurações da empresa não encontradas');
  }

  // Validar formato UUID do company_id
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(companySettings.company_id)) {
    console.error('🚫 Erro: company_id não está em formato UUID válido:', companySettings.company_id);
    throw new Error('ID da empresa inválido');
  }

  console.log('✅ company_id validado:', companySettings.company_id);

  // Check if time slot is still available
  const appointments = getStorageData<MockAppointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
  const conflictCheck = appointments.filter(
    appointment => 
      appointment.company_id === companySettings.company_id &&
      appointment.appointment_date === selectedDate &&
      appointment.appointment_time === selectedTime &&
      appointment.status !== 'cancelled'
  );

  if (conflictCheck.length > 0) {
    throw new Error('Este horário já foi ocupado. Por favor, escolha outro horário.');
  }

  // Create or find client
  let clientId;
  const clients = getStorageData<MockClient[]>(STORAGE_KEYS.CLIENTS, []);
  const existingClient = clients.find(
    client => 
      client.company_id === companySettings.company_id &&
      client.phone === clientPhone
  );

  if (existingClient) {
    clientId = existingClient.id;
    
    // Update existing client
    const updatedClients = clients.map(client =>
      client.id === clientId
        ? { ...client, name: clientName }
        : client
    );
    setStorageData(STORAGE_KEYS.CLIENTS, updatedClients);
  } else {
    // Create new client
    const newClientId = `client-${Date.now()}`;
    const newClient: MockClient = {
      id: newClientId,
      company_id: companySettings.company_id,
      name: clientName,
      phone: clientPhone,
      created_at: new Date().toISOString()
    };

    console.log('✅ Cliente criado com sucesso:', newClientId);
    clients.push(newClient);
    setStorageData(STORAGE_KEYS.CLIENTS, clients);
    clientId = newClientId;
  }

  // Find service duration
  const service = services.find(s => s.id === selectedService);

  // Create appointment
  const appointmentId = `appointment-${Date.now()}`;
  const newAppointment: MockAppointment = {
    id: appointmentId,
    company_id: companySettings.company_id,
    client_id: clientId,
    service_id: selectedService,
    professional_id: selectedProfessional || undefined,
    appointment_date: selectedDate,
    appointment_time: selectedTime,
    duration: service?.duration || 60,
    status: 'confirmed',
    created_at: new Date().toISOString()
  };

  appointments.push(newAppointment);
  setStorageData(STORAGE_KEYS.APPOINTMENTS, appointments);

  return {
    appointment: newAppointment,
    service,
    formattedDate: formatAppointmentDate(selectedDate),
    professionalName: selectedProfessional 
      ? professionals.find(p => p.id === selectedProfessional)?.name || 'Profissional'
      : 'Qualquer profissional'
  };
};

export const generateWhatsAppMessage = (
  clientName: string,
  clientPhone: string,
  formattedDate: string,
  selectedTime: string,
  serviceName: string,
  professionalName: string
) => {
  return `🗓️ *NOVO AGENDAMENTO*\n\n` +
    `👤 *Cliente:* ${clientName}\n` +
    `📞 *Telefone:* ${clientPhone}\n` +
    `📅 *Data:* ${formattedDate}\n` +
    `⏰ *Horário:* ${selectedTime}\n` +
    `💼 *Serviço:* ${serviceName}\n` +
    `👨‍💼 *Profissional:* ${professionalName}\n` +
    `\n✅ Agendamento confirmado automaticamente!`;
};
