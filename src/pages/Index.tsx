
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MerchantDashboard from '../components/MerchantDashboard';
import MonthlyAgenda from '../components/MonthlyAgenda';
import SettingsPanel from '../components/SettingsPanel';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Home, Settings, LogOut, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'dashboard' | 'agenda' | 'settings'>('dashboard');
  const [profileComplete, setProfileComplete] = useState(false);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if profile is complete and get company name
    const checkProfile = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile || !profile.company_name) {
        navigate('/company-setup');
        return;
      }

      setCompanyName(profile.company_name);
      setProfileComplete(true);
    };

    checkProfile();
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">ZapAgenda</div>
          <div className="text-gray-600">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!user || !profileComplete) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-3 md:p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-bold text-green-600">ZapAgenda</h1>
            <p className="text-xs md:text-sm text-gray-600">{companyName}</p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <MoreHorizontal className="w-5 h-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setCurrentView('dashboard')}>
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrentView('agenda')}>
                <Calendar className="w-4 h-4 mr-2" />
                Agenda Mensal
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCurrentView('settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-4 md:pb-16">
        {currentView === 'dashboard' && <MerchantDashboard companyName={companyName} />}
        {currentView === 'agenda' && <MonthlyAgenda />}
        {currentView === 'settings' && <SettingsPanel />}
      </div>

      {/* Bottom Navigation for Mobile - Only Dashboard */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 md:hidden">
        <div className="flex justify-center">
          <Button
            variant={currentView === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('dashboard')}
            className="flex-1 mx-1"
          >
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
