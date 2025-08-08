
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CalendarPlus, Settings } from 'lucide-react';
import DashboardContent from '@/components/dashboard/DashboardContent';
import { useDashboardData } from '@/hooks/useDashboardData';
import NewAppointmentModal from '@/components/NewAppointmentModal';

const MerchantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { refreshData } = useDashboardData();

  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);

  // Mock data for services and professionals - in a real app, these would come from hooks
  const services = [
    { id: '1', name: 'Corte de Cabelo', duration: 30, price: 35 },
    { id: '2', name: 'Barba', duration: 20, price: 20 },
    { id: '3', name: 'Corte + Barba', duration: 50, price: 50 }
  ];
  
  const professionals = [
    { id: '1', name: 'João Silva' },
    { id: '2', name: 'Maria Santos' }
  ];

  const handleNewAppointmentSuccess = () => {
    // Refresh appointments after successful creation
    refreshData();
    setShowNewAppointmentModal(false);
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">
            Dashboard
          </h1>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={() => setShowNewAppointmentModal(true)}>
              <CalendarPlus className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Button>
            <Button variant="outline" size="sm" onClick={handleSettingsClick}>
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <DashboardContent />
      </div>

      {/* New Appointment Modal */}
      <NewAppointmentModal
        isOpen={showNewAppointmentModal}
        onClose={() => setShowNewAppointmentModal(false)}
        companyId={user?.id || ''}
        services={services}
        professionals={professionals}
        onAppointmentCreated={handleNewAppointmentSuccess}
      />
    </div>
  );
};

export default MerchantDashboard;
