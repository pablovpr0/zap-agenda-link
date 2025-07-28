import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import MerchantDashboard from '../components/MerchantDashboard';
import MonthlyAgenda from '../components/MonthlyAgenda';
import SettingsPanel from '../components/SettingsPanel';
import ClientManagement from '../components/ClientManagement';
import ServiceManagement from '../components/ServiceManagement';
import ProfileCustomizationModal from '../components/ProfileCustomizationModal';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Calendar, Users, Briefcase, LogOut, HelpCircle, Palette } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getStorageData, MockProfile, STORAGE_KEYS } from '@/data/mockData';

type ViewType = 'dashboard' | 'agenda' | 'settings' | 'clients' | 'services';

const Index = () => {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [profileComplete, setProfileComplete] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if profile is complete and get company name
    const checkProfile = async () => {
      const profileData = getStorageData<MockProfile>(STORAGE_KEYS.PROFILE, null);

      if (!profileData || !profileData.company_name) {
        navigate('/company-setup');
        return;
      }

      setCompanyName(profileData.company_name);
      setProfileComplete(true);
    };

    checkProfile();
  }, [user, isLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleProfileSuccess = () => {
    // Recarregar dados após atualização do perfil
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-whatsapp-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-whatsapp-green">ZapAgenda</div>
          <div className="text-whatsapp-muted">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!user || !profileComplete) {
    return null; // Will redirect via useEffect
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <MerchantDashboard companyName={companyName} onViewChange={setCurrentView} />;
      case 'agenda':
        return <MonthlyAgenda />;
      case 'settings':
        return <SettingsPanel />;
      case 'clients':
        return <ClientManagement />;
      case 'services':
        return <ServiceManagement />;
      default:
        return <MerchantDashboard companyName={companyName} onViewChange={setCurrentView} />;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-whatsapp-bg">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-whatsapp p-3 md:p-4 sticky top-0 z-50">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-bold text-whatsapp-green">ZapAgenda</h1>
              <p className="text-xs md:text-sm text-whatsapp-muted">{companyName}</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-50">
                  <MoreHorizontal className="w-5 h-5 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-whatsapp">
                <DropdownMenuItem onClick={() => setCurrentView('dashboard')} className="hover:bg-gray-50">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentView('agenda')} className="hover:bg-gray-50">
                  <Calendar className="w-4 h-4 mr-2" />
                  Agenda Mensal
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-whatsapp-border" />
                <DropdownMenuItem onClick={() => setShowProfileModal(true)} className="hover:bg-gray-50">
                  <Palette className="w-4 h-4 mr-2" />
                  Personalizar Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentView('clients')} className="hover:bg-gray-50">
                  <Users className="w-4 h-4 mr-2" />
                  Gerenciar Clientes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentView('services')} className="hover:bg-gray-50">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Gerenciar Serviços
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-whatsapp-border" />
                <DropdownMenuItem className="hover:bg-gray-50">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Suporte
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-whatsapp-border" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:bg-red-50">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Content */}
        <div className="pb-4 md:pb-8">
          {renderContent()}
        </div>
      </div>

      {/* Modal de Personalização de Perfil */}
      <ProfileCustomizationModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSuccess={handleProfileSuccess}
      />
    </>
  );
};

export default Index;
