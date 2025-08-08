
import { supabase } from '@/integrations/supabase/client';
import { getNowInBrazil, getTodayInBrazil } from '@/utils/timezone';
import { format, subMonths } from 'date-fns';

export interface ReportData {
  totalAppointments: number;
  totalRevenue: number;
  completionRate: number;
  appointmentsGrowth: number;
  monthlyRevenue: Record<string, number>;
}

export const generateReport = async (companyId: string): Promise<ReportData> => {
  try {
    // Get current month data
    const today = getTodayInBrazil();
    const currentMonth = getNowInBrazil();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];

    // Total appointments this month
    const { data: monthlyAppointments, error: monthlyError } = await supabase
      .from('appointments')
      .select('id, status')
      .eq('company_id', companyId)
      .gte('appointment_date', firstDayOfMonth)
      .lte('appointment_date', lastDayOfMonth);

    if (monthlyError) throw monthlyError;

    // Revenue from completed appointments
    const { data: completedAppointments, error: revenueError } = await supabase
      .from('appointments')
      .select('service_id, services(price)')
      .eq('company_id', companyId)
      .eq('status', 'completed')
      .gte('appointment_date', firstDayOfMonth)
      .lte('appointment_date', lastDayOfMonth);

    if (revenueError) throw revenueError;

    const totalRevenue = completedAppointments?.reduce((total, apt: any) => {
      return total + (apt.services?.price || 0);
    }, 0) || 0;

    // Calculate completion rate
    const totalAppointments = monthlyAppointments?.length || 0;
    const completedCount = monthlyAppointments?.filter(apt => apt.status === 'completed').length || 0;
    const completionRate = totalAppointments > 0 ? (completedCount / totalAppointments) * 100 : 0;

    // Monthly revenue for the last 6 months
    const monthlyRevenue: Record<string, number> = {};
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
      const monthName = format(date, 'MMMM');

      const { data: monthData } = await supabase
        .from('appointments')
        .select('service_id, services(price)')
        .eq('company_id', companyId)
        .eq('status', 'completed')
        .gte('appointment_date', monthStart)
        .lte('appointment_date', monthEnd);

      const revenue = monthData?.reduce((total, apt: any) => {
        return total + (apt.services?.price || 0);
      }, 0) || 0;

      monthlyRevenue[monthName] = revenue;
    }

    return {
      totalAppointments,
      totalRevenue,
      completionRate,
      appointmentsGrowth: 10, // Mock growth rate
      monthlyRevenue
    };
  } catch (error) {
    console.error('Error generating report:', error);
    throw new Error('Failed to generate report');
  }
};
