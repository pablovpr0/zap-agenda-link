export interface CompanySettings {
  company_id: string;
  company_name: string;
  company_phone?: string;
  slug: string;
  logo_url?: string;
  welcome_message?: string;
  instagram_url?: string;
  working_hours_start: string;
  working_hours_end: string;
  lunch_break_enabled?: boolean;
  lunch_start_time?: string;
  lunch_end_time?: string;
  working_days: number[];
  appointment_interval: number;
  advance_booking_limit: number;
  monthly_appointments_limit?: number;
  phone?: string;
  theme_color?: string;
  selected_theme_id?: string;
}

export interface Profile {
  id: string;
  company_name: string;
  company_description?: string;
  company_logo?: string;
  company_address?: string;
  company_website?: string;
  business_type?: string;
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
  clientEmail?: string;
  notes?: string;
}
