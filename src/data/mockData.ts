
// Mock data for frontend-only version
export interface MockUser {
  id: string;
  email: string;
  name: string;
}

export interface MockClient {
  id: string;
  company_id: string;
  name: string;
  phone: string;
  email?: string;
  created_at: string;
}

export interface MockService {
  id: string;
  company_id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
  is_active: boolean;
}

export interface MockProfessional {
  id: string;
  company_id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  role: string;
  is_active: boolean;
}

export interface MockAppointment {
  id: string;
  company_id: string;
  client_id: string;
  service_id: string;
  professional_id?: string;
  appointment_date: string;
  appointment_time: string;
  duration: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
}

export interface MockCompanySettings {
  company_id: string;
  company_name: string;
  company_phone?: string;
  company_slug: string;
  working_hours_start: string;
  working_hours_end: string;
  lunch_break_start?: string;
  lunch_break_end?: string;
  lunch_break_enabled?: boolean;
  working_days: number[];
  appointment_duration: number;
  advance_booking_days: number;
  monthly_appointments_limit?: number;
}

export interface MockProfile {
  id: string;
  company_name: string;
  company_description?: string;
  company_logo?: string;
  company_address?: string;
  company_website?: string;
  business_type?: string;
  profile_image_url?: string;
}

// Default data
export const defaultUser: MockUser = {
  id: 'user-1',
  email: 'demo@example.com',
  name: 'Usuário Demo'
};

export const defaultCompanySettings: MockCompanySettings = {
  company_id: 'user-1',
  company_name: 'Minha Empresa',
  company_slug: 'minha-empresa',
  working_hours_start: '09:00',
  working_hours_end: '18:00',
  working_days: [1, 2, 3, 4, 5],
  appointment_duration: 60,
  advance_booking_days: 30,
  lunch_break_enabled: false
};

export const defaultProfile: MockProfile = {
  id: 'user-1',
  company_name: 'Minha Empresa',
  company_description: 'Sua empresa de serviços',
  business_type: 'Serviços gerais'
};

// Storage keys
export const STORAGE_KEYS = {
  USER: 'zapagenda_user',
  COMPANY_SETTINGS: 'zapagenda_company_settings',
  PROFILE: 'zapagenda_profile',
  CLIENTS: 'zapagenda_clients',
  SERVICES: 'zapagenda_services',
  PROFESSIONALS: 'zapagenda_professionals',
  APPOINTMENTS: 'zapagenda_appointments',
  IS_AUTHENTICATED: 'zapagenda_is_authenticated'
};

// Local storage utilities
export const getStorageData = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const setStorageData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const removeStorageData = (key: string): void => {
  localStorage.removeItem(key);
};

// Initialize default data if not exists
export const initializeDefaultData = () => {
  // Set user if authenticated
  const isAuthenticated = getStorageData(STORAGE_KEYS.IS_AUTHENTICATED, false);
  if (isAuthenticated) {
    if (!localStorage.getItem(STORAGE_KEYS.USER)) {
      setStorageData(STORAGE_KEYS.USER, defaultUser);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMPANY_SETTINGS)) {
      setStorageData(STORAGE_KEYS.COMPANY_SETTINGS, defaultCompanySettings);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
      setStorageData(STORAGE_KEYS.PROFILE, defaultProfile);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
      setStorageData(STORAGE_KEYS.CLIENTS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
      setStorageData(STORAGE_KEYS.SERVICES, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROFESSIONALS)) {
      setStorageData(STORAGE_KEYS.PROFESSIONALS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
      setStorageData(STORAGE_KEYS.APPOINTMENTS, []);
    }
  }
};
