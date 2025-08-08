
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DashboardContent from '@/components/dashboard/DashboardContent';

const MerchantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <DashboardContent />
      </div>
    </div>
  );
};

export default MerchantDashboard;
