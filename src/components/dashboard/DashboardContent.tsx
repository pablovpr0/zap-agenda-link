
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import WelcomeSection from './WelcomeSection';
import DashboardStats from './DashboardStats';
import RevenueCard from './RevenueCard';
import QuickActions from './QuickActions';
import TodayAppointmentsList from './TodayAppointmentsList';
import PublicBookingLink from './PublicBookingLink';
import RecentAppointments from './RecentAppointments';
import ReportsButton from '@/components/reports/ReportsButton';
import NewAppointmentModal from '@/components/NewAppointmentModal';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useDashboardActions } from '@/hooks/useDashboardActions';

const DashboardContent = () => {
  const { user } = useAuth();
  const { 
    data,
    loading, 
    refreshData,
    bookingLink,
    linkCopied,
    handleCopyLink,
    handleViewPublicPage,
    handleShareWhatsApp
  } = useDashboardData();

  const {
    handleStatusChange,
    handleDeleteAppointment,
    handleWhatsAppClick,
    handleCreateAppointment,
    isCreatingAppointment
  } = useDashboardActions();

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
    refreshData();
    setShowNewAppointmentModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <WelcomeSection />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardStats
          todayAppointments={data.todayAppointments}
          totalRevenue={data.monthlyRevenue}
        />
        <RevenueCard totalRevenue={data.monthlyRevenue} />
      </div>

      {/* Quick Actions */}
      <QuickActions 
        onNewAppointment={() => setShowNewAppointmentModal(true)}
        onViewPublicPage={handleViewPublicPage}
        onManageClients={() => {}}
        onShowSettings={() => {}}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Today's Appointments */}
        <div className="lg:col-span-2">
          <TodayAppointmentsList
            appointments={data.todayAppointmentsList}
            loading={loading}
          />
        </div>

        {/* Right Column - Actions and Links */}
        <div className="space-y-6">
          <PublicBookingLink
            bookingLink={bookingLink}
            linkCopied={linkCopied}
            onViewPublicPage={handleViewPublicPage}
            onCopyLink={handleCopyLink}
            onShareWhatsApp={handleShareWhatsApp}
          />
          <RecentAppointments appointments={data.recentAppointments} />
          {user && (
            <ReportsButton companyId={user.id} />
          )}
        </div>
      </div>

      {/* New Appointment Modal */}
      {user && (
        <NewAppointmentModal
          isOpen={showNewAppointmentModal}
          onClose={() => setShowNewAppointmentModal(false)}
          companyId={user.id}
          services={services}
          professionals={professionals}
          onAppointmentCreated={handleNewAppointmentSuccess}
        />
      )}
    </div>
  );
};

export default DashboardContent;
