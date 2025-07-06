
import { useState } from 'react';
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
    refreshData(); // Recarregar dados após criar agendamento
  };

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
        data={data}
        linkCopied={linkCopied}
        onViewPublicPage={handleViewPublicPage}
        onCopyLink={handleCopyLink}
        onShareWhatsApp={handleShareWhatsApp}
        onNewAppointment={() => setShowNewAppointmentModal(true)}
        onManageClients={() => onViewChange('clients')}
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
