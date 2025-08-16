import DashboardStats from './DashboardStats';
import QuickActions from './QuickActions';
import PublicBookingLink from './PublicBookingLink';
import WelcomeSection from './WelcomeSection';
import TodayAppointmentsList from './TodayAppointmentsList';
import RecentAppointmentsList from './RecentAppointmentsList';
import RevenueCard from './RevenueCard';
import MonthlyAgenda from '../MonthlyAgenda';
import ReportsButton from '../reports/ReportsButton';
import { useDashboardActions } from '@/hooks/useDashboardActions';
interface DashboardContentProps {
  companyName: string;
  onShowAppointments: () => void;
  onShowClients: () => void;
  onShowServices: () => void;
  onShowSettings: () => void;
  onShowMonthlyAgenda: () => void;
  onRefreshData: () => void;
  data?: {
    todayAppointments: number;
    totalClients: number;
    monthlyRevenue: number;
    completionRate: number;
    bookingLink: string;
    recentAppointments: unknown[];
    todayAppointmentsList: unknown[];
  };
  loading?: boolean;
}
const DashboardContent = ({
  companyName,
  onShowAppointments,
  onShowClients,
  onShowServices,
  onShowSettings,
  onShowMonthlyAgenda,
  onRefreshData,
  data = {
    todayAppointments: 0,
    totalClients: 0,
    monthlyRevenue: 0,
    completionRate: 0,
    bookingLink: '',
    recentAppointments: [],
    todayAppointmentsList: []
  },
  loading = false
}: DashboardContentProps) => {
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

          {/* Agendamentos de Hoje - Logo abaixo do calendário */}
          <TodayAppointmentsList 
            appointments={data.todayAppointmentsList} 
            loading={loading} 
            onRefresh={onRefreshData} 
          />

          {/* Agendamentos Recentes - Após agendamentos de hoje */}
          <RecentAppointmentsList 
            appointments={data.recentAppointments} 
            loading={loading} 
            onRefresh={onRefreshData} 
          />
        </div>

        <div className="space-y-4 md:space-y-6 min-w-0">
          {/* Receitas de Hoje - Movido para a coluna da direita */}
          <RevenueCard />
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