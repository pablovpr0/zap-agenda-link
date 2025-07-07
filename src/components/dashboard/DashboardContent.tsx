
import DashboardStats from './DashboardStats';
import PublicBookingLink from './PublicBookingLink';
import QuickActions from './QuickActions';
import WelcomeSection from './WelcomeSection';
import MonthlyAgenda from '../MonthlyAgenda';

interface DashboardContentProps {
  data: {
    todayAppointments: number;
    totalClients: number;
    monthlyRevenue: number;
    completionRate: number;
    bookingLink: string;
    recentAppointments: any[];
  };
  linkCopied: boolean;
  onViewPublicPage: () => void;
  onCopyLink: () => void;
  onShareWhatsApp: () => void;
  onNewAppointment: () => void;
  onManageClients: () => void;
  onRefreshAppointments: () => void;
}

const DashboardContent = ({
  data,
  linkCopied,
  onViewPublicPage,
  onCopyLink,
  onShareWhatsApp,
  onNewAppointment,
  onManageClients,
  onRefreshAppointments
}: DashboardContentProps) => {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Boas-vindas */}
      <WelcomeSection />

      {/* Estatísticas */}
      <DashboardStats stats={{
        todayAppointments: data.todayAppointments,
        totalClients: data.totalClients,
        monthlyRevenue: data.monthlyRevenue,
        completionRate: data.completionRate
      }} />

      {/* Link de agendamento público */}
      <PublicBookingLink
        bookingLink={data.bookingLink}
        linkCopied={linkCopied}
        onViewPublicPage={onViewPublicPage}
        onCopyLink={onCopyLink}
        onShareWhatsApp={onShareWhatsApp}
      />

      {/* Ações rápidas */}
      <QuickActions
        onNewAppointment={onNewAppointment}
        onViewPublicPage={onViewPublicPage}
        onManageClients={onManageClients}
      />

      {/* Agenda mensal integrada */}  
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <MonthlyAgenda />
      </div>
    </div>
  );
};

export default DashboardContent;
