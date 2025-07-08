
import { useState, useEffect } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useDashboardActions } from '@/hooks/useDashboardActions';
import DashboardContent from './dashboard/DashboardContent';
import NewAppointmentModal from './NewAppointmentModal';

interface MerchantDashboardProps {
  companyName: string;
  onViewChange: (view: 'dashboard' | 'agenda' | 'settings' | 'clients' | 'services') => void;
}

const MerchantDashboard = ({ companyName, onViewChange }: MerchantDashboardProps) => {
  const { data, loading, refreshData } = useDashboardData(companyName);
  const { linkCopied, handleCopyLink, handleViewPublicPage, handleShareWhatsApp } = useDashboardActions(data.bookingLink);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);

  const handleNewAppointmentSuccess = () => {
    console.log('Novo agendamento criado, atualizando dashboard...');
    refreshData(); // Recarregar dados após criar agendamento
  };

  // Refresh automático a cada 30 segundos para garantir sincronização
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        refreshData();
      }
    }, 30000);

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
