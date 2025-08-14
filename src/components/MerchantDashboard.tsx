
import { useState, useEffect } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useDashboardActions } from '@/hooks/useDashboardActions';
import DashboardContent from './dashboard/DashboardContent';
import NewAppointmentModal from './NewAppointmentModal';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

interface MerchantDashboardProps {
  companyName: string;
  onViewChange: (view: 'dashboard' | 'agenda' | 'settings' | 'clients' | 'services') => void;
}

const MerchantDashboard = ({ companyName, onViewChange }: MerchantDashboardProps) => {
  const { data, loading, refreshData } = useDashboardData();
  const { linkCopied, handleCopyLink, handleViewPublicPage, handleShareWhatsApp } = useDashboardActions(data.bookingLink);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);

  const handleNewAppointmentSuccess = () => {
    devLog('Novo agendamento criado, atualizando dashboard...');
    refreshData(); // Recarregar dados após criar agendamento
  };

  // Aumentar refresh automático para 60 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        refreshData();
      }
    }, 60000); // Mudado de 30000ms para 60000ms (60 segundos)

    return () => clearInterval(interval);
  }, [refreshData, loading]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green mx-auto"></div>
          <p className="mt-2 text-gray-500">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardContent
        companyName={companyName}
        onShowAppointments={() => setShowNewAppointmentModal(true)}
        onShowClients={() => onViewChange('clients')}
        onShowServices={() => onViewChange('services')}
        onShowSettings={() => onViewChange('settings')}
        onShowMonthlyAgenda={() => onViewChange('agenda')}
        onRefreshData={refreshData}
      />

      {/* Modal de novo agendamento */}
      <NewAppointmentModal
        isOpen={showNewAppointmentModal}
        onClose={() => setShowNewAppointmentModal(false)}
        onSuccess={handleNewAppointmentSuccess}
      />
    </>
  );
};

export default MerchantDashboard;
