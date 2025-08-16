
// Simplified appointment types to avoid circular dependencies

export interface BaseAppointmentData {
  id?: string;
  company_id: string;
  service_id: string;
  professional_id?: string;
}

export interface AppointmentClientData {
  client_id?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
}

export interface AppointmentScheduleData {
  appointment_date: string;
  appointment_time: string;
  status?: 'confirmed' | 'completed' | 'cancelled' | 'scheduled';
  notes?: string;
  duration?: number;
  created_at?: string;
  updated_at?: string;
}

// Main appointment interface combining all data
export interface AppointmentData extends 
  BaseAppointmentData, 
  AppointmentClientData, 
  AppointmentScheduleData {}

// Helper types for specific operations
export type CreateAppointmentData = Omit<AppointmentData, 'id' | 'created_at' | 'updated_at'>;
export type UpdateAppointmentData = Partial<AppointmentData> & { id: string };

// Simple database row type to avoid Supabase complexity
export interface AppointmentRow {
  id: string;
  company_id: string;
  client_id?: string;
  service_id: string;
  professional_id?: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes?: string;
  duration?: number;
  created_at: string;
  updated_at: string;
}
