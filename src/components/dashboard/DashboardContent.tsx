
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import WelcomeSection from '@/components/dashboard/WelcomeSection';
import DashboardStats from '@/components/dashboard/DashboardStats';
import RevenueCard from '@/components/dashboard/RevenueCard';
import QuickActions from '@/components/dashboard/QuickActions';
import TodayAppointmentsList from '@/components/dashboard/TodayAppointmentsList';
import PublicBookingLink from '@/components/dashboard/PublicBookingLink';
import RecentAppointments from '@/components/dashboard/RecentAppointments';
import ReportsButton from '@/components/reports/ReportsButton';
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
          stats={{
            todayAppointments: data.todayAppointments,
            totalClients: data.totalClients,
            monthlyRevenue: data.monthlyRevenue,
            completionRate: data.completionRate
          }}
        />
        <RevenueCard 
          stats={{
            monthlyRevenue: data.monthlyRevenue
          }}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions 
        onNewAppointment={() => {}}
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
            onRefresh={refreshData}
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
          <RecentAppointments 
            appointments={data.recentAppointments} 
          />
          {user && (
            <ReportsButton companyId={user.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
