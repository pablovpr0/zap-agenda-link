
export interface DashboardData {
  todayAppointments: number;
  totalClients: number;
  monthlyRevenue: number;
  completionRate: number;
  bookingLink: string;
  recentAppointments: RecentAppointment[];
  todayAppointmentsList: TodayAppointment[];
}

export interface TodayAppointment {
  id: string;
  appointment_time: string;
  status: string;
  client_name: string;
  client_phone: string;
  service_name: string;
}

export interface RecentAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  client_name: string;
  client_phone: string;
  service_name: string;
}
