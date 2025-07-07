
import DashboardStats from './DashboardStats';
import QuickActions from './QuickActions';
import PublicBookingLink from './PublicBookingLink';
import RecentAppointments from './RecentAppointments';
import WelcomeSection from './WelcomeSection';
import TodayAppointmentsList from './TodayAppointmentsList';
import { useDashboardData } from '@/hooks/useDashboardData';

interface DashboardContentProps {
  companyName: string;
  onShowAppointments: () => void;
  onShowClients: () => void;
  onShowServices: () => void;
  onShowSettings: () => void;
  onShowMonthlyAgenda: () => void;
}

const DashboardContent = ({ 
  companyName, 
  onShowAppointments, 
  onShowClients, 
  onShowServices, 
  onShowSettings,
  onShowMonthlyAgenda
}: DashboardContentProps) => {
  const { data, loading } = useDashboardData(companyName);

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 fade-in">
      <WelcomeSection companyName={companyName} />
      
      <DashboardStats
        todayAppointments={data.todayAppointments}
        totalClients={data.totalClients}
        monthlyRevenue={data.monthlyRevenue}
        completionRate={data.completionRate}
        loading={loading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-4 md:space-y-6">
          <QuickActions
            onShowAppointments={onShowAppointments}
            onShowClients={onShowClients}
            onShowServices={onShowServices}
            onShowSettings={onShowSettings}
            onShowMonthlyAgenda={onShowMonthlyAgenda}
          />
          
          <PublicBookingLink bookingLink={data.bookingLink} />
        </div>

        <div className="space-y-4 md:space-y-6">
          <TodayAppointmentsList 
            appointments={data.todayAppointmentsList}
            loading={loading}
          />
          
          <RecentAppointments 
            appointments={data.recentAppointments}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
