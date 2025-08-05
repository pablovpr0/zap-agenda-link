
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
            onShowSettings={onShowSettings}
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
          <RevenueCard />
          
          <TodayAppointmentsList 
            appointments={data.todayAppointmentsList}
            loading={loading}
            onRefresh={onRefreshData}
          />
        </div>
      </div>

      {/* Seção de Configurações Importantes */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              ⚙️ Configurações do Sistema
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure horários de funcionamento, dados da empresa e outras configurações importantes
            </p>
          </div>
          <button
            onClick={onShowSettings}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Abrir Configurações
          </button>
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
