
export interface CompanySettings {
  company_id: string;
  company_name: string;
  company_phone?: string;
  slug: string;
  working_hours_start: string;
  working_hours_end: string;
  lunch_break_enabled?: boolean;
  lunch_start_time?: string;
  lunch_end_time?: string;
  working_days: number[];
  appointment_interval: number;
  advance_booking_limit: number;
}

export interface Profile {
  id: string;
  company_name: string;
  company_description?: string;
  company_logo?: string;
  company_address?: string;
  company_website?: string;
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
}
