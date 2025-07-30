
import DashboardStats from './DashboardStats';
import QuickActions from './QuickActions';
import PublicBookingLink from './PublicBookingLink';
import WelcomeSection from './WelcomeSection';
import TodayAppointmentsList from './TodayAppointmentsList';
import MonthlyAgenda from '../MonthlyAgenda';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useDashboardActions } from '@/hooks/useDashboardActions';

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
  const { data, loading } = useDashboardData();
  const { linkCopied, handleCopyLink, handleViewPublicPage, handleShareWhatsApp } = useDashboardActions(data.bookingLink);

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 fade-in">
      <WelcomeSection />
      
      <DashboardStats
        stats={{
          todayAppointments: data.todayAppointments,
          totalClients: data.totalClients,
          monthlyRevenue: data.monthlyRevenue,
          completionRate: data.completionRate
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-4 md:space-y-6">
          <QuickActions
            onNewAppointment={onShowAppointments}
            onViewPublicPage={handleViewPublicPage}
            onManageClients={onShowClients}
          />
          
          <PublicBookingLink 
            bookingLink={data.bookingLink}
            linkCopied={linkCopied}
            onViewPublicPage={handleViewPublicPage}
            onCopyLink={handleCopyLink}
            onShareWhatsApp={handleShareWhatsApp}
          />

          {/* Agenda Mensal - Movida para baixo do link público */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <MonthlyAgenda />
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          <TodayAppointmentsList 
            appointments={data.todayAppointmentsList}
            loading={loading}
          />
          
          {/* Removido RecentAppointments */}
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
