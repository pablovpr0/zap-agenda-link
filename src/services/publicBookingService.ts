import { getStorageData, MockCompanySettings, MockProfile, MockService, MockProfessional, MockAppointment, STORAGE_KEYS } from '@/data/mockData';
import { Professional } from './professionalsService';

export const loadCompanyDataBySlug = async (companySlug: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  const companySettings = getStorageData<MockCompanySettings | null>(STORAGE_KEYS.COMPANY_SETTINGS, null);
  const profile = getStorageData<MockProfile | null>(STORAGE_KEYS.PROFILE, null);
  const services = getStorageData<MockService[]>(STORAGE_KEYS.SERVICES, []);

  // Check if slug matches
  if (!companySettings || companySettings.company_slug !== companySlug) {
    throw new Error('Empresa não encontrada');
  }

  const activeServices = services.filter(service => 
    service.company_id === companySettings.company_id && service.is_active
  );

  return {
    companySettings,
    profile,
    services: activeServices
  };
};

export const fetchActiveProfessionals = async (companyId: string): Promise<Professional[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const professionals = getStorageData<MockProfessional[]>(STORAGE_KEYS.PROFESSIONALS, []);
  
  return professionals.filter(professional => 
    professional.company_id === companyId && professional.is_active
  );
};

export const checkAvailableTimes = async (
  companyId: string,
  selectedDate: string,
  selectedService?: string,
  selectedProfessional?: string
) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const appointments = getStorageData<MockAppointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
  
  return appointments.filter(appointment =>
    appointment.company_id === companyId &&
    appointment.appointment_date === selectedDate &&
    appointment.status !== 'cancelled' &&
    (!selectedService || appointment.service_id === selectedService) &&
    (!selectedProfessional || appointment.professional_id === selectedProfessional)
  );
};