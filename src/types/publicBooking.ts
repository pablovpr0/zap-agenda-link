
export interface CompanySettings {
  id: string;
  company_id: string;
  slug: string;
  address?: string;
  phone?: string;
  working_days: number[];
  working_hours_start: string;
  working_hours_end: string;
  appointment_interval: number;
  max_simultaneous_appointments: number;
  advance_booking_limit: number;
  monthly_appointments_limit: number;
  lunch_break_enabled?: boolean;
  lunch_start_time?: string;
  lunch_end_time?: string;
  instagram_url?: string;
  logo_url?: string;
  cover_image_url?: string;
  theme_color: string;
  welcome_message?: string;
}

export interface Profile {
  id: string;
  company_name: string;
  business_type: string;
  profile_image_url?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price?: number;
}

export interface BookingFormData {
  selectedService: string;
  selectedProfessional?: string;
  selectedDate: string;
  selectedTime: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  notes: string;
}
