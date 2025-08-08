import DashboardStats from './DashboardStats';
import QuickActions from './QuickActions';
import PublicBookingLink from './PublicBookingLink';
import WelcomeSection from './WelcomeSection';
import TodayAppointmentsList from './TodayAppointmentsList';
import RevenueCard from './RevenueCard';
import MonthlyAgenda from '../MonthlyAgenda';
import ReportsButton from '../reports/ReportsButton';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useDashboardActions } from '@/hooks/useDashboardActions';
import { Settings } from 'lucide-react';
interface DashboardContentProps {
  companyName: string;
  onShowAppointments: () => void;
  onShowClients: () => void;
  onShowServices: () => void;
  onShowSettings: () => void;
  onShowMonthlyAgenda: () => void;
  onRefreshData: () => void;
}
const DashboardContent = ({
  companyName,
  onShowAppointments,
  onShowClients,
  onShowServices,
  onShowSettings,
  onShowMonthlyAgenda,
  onRefreshData
}: DashboardContentProps) => {
  const {
    data,
    loading
  } = useDashboardData();
  const {
    linkCopied,
    handleCopyLink,
    handleViewPublicPage,
    handleShareWhatsApp
  } = useDashboardActions(data.bookingLink);
  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 fade-in max-w-7xl mx-auto">
      <WelcomeSection />
      
      <DashboardStats stats={{
        todayAppointments: data.todayAppointments,
        totalClients: data.totalClients,
        monthlyRevenue: data.monthlyRevenue,
        completionRate: data.completionRate
      }} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-4 md:space-y-6 min-w-0">
          <QuickActions 
            onNewAppointment={onShowAppointments} 
            onViewPublicPage={handleViewPublicPage} 
            onManageClients={onShowClients} 
            onShowSettings={onShowSettings} 
          />
          
          <PublicBookingLink 
            bookingLink={data.bookingLink} 
            linkCopied={linkCopied} 
            onViewPublicPage={handleViewPublicPage} 
            onCopyLink={handleCopyLink} 
            onShareWhatsApp={handleShareWhatsApp} 
          />

          {/* Agenda Mensal - Responsiva */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <MonthlyAgenda />
          </div>
        </div>

        <div className="space-y-4 md:space-y-6 min-w-0">
          <RevenueCard />
          
          <TodayAppointmentsList 
            appointments={data.todayAppointmentsList} 
            loading={loading} 
            onRefresh={onRefreshData} 
          />
        </div>
      </div>

      {/* Botão de Relatórios no final da página */}
      <div className="flex justify-center pt-6">
        <ReportsButton />
      </div>
    </div>
  );
};
export default DashboardContent;