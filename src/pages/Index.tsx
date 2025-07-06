
import { useState } from 'react';
import MerchantDashboard from '../components/MerchantDashboard';
import MonthlyAgenda from '../components/MonthlyAgenda';
import SettingsPanel from '../components/SettingsPanel';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Home, Settings, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Index = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'agenda' | 'settings'>('dashboard');

  const handleLogout = () => {
    // Implementar logout aqui
    console.log('Logout realizado');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">ZapAgenda</h1>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <MoreHorizontal className="w-5 h-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setCurrentView('dashboard')}>
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrentView('settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-16">
        {currentView === 'dashboard' && <MerchantDashboard />}
        {currentView === 'agenda' && <MonthlyAgenda />}
        {currentView === 'settings' && <SettingsPanel />}
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 md:hidden">
        <div className="flex justify-around">
          <Button
            variant={currentView === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('dashboard')}
            className="flex-1 mx-1"
          >
            Dashboard
          </Button>
          <Button
            variant={currentView === 'agenda' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('agenda')}
            className="flex-1 mx-1"
          >
            Agenda
          </Button>
          <Button
            variant={currentView === 'settings' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('settings')}
            className="flex-1 mx-1"
          >
            Config
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
