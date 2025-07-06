
import { useState } from 'react';
import MerchantDashboard from '../components/MerchantDashboard';
import AgendaView from '../components/AgendaView';
import SettingsPanel from '../components/SettingsPanel';
import { Button } from '@/components/ui/button';
import { MessageCircle, Calendar, Settings, Users } from 'lucide-react';

const Index = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'agenda' | 'settings'>('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">ZapAgenda</h1>
              <p className="text-sm opacity-90">Painel do Comerciante</p>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex gap-2">
            <Button
              variant={currentView === 'dashboard' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('dashboard')}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <Users className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={currentView === 'agenda' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('agenda')}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Agenda
            </Button>
            <Button
              variant={currentView === 'settings' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('settings')}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto bg-white min-h-[calc(100vh-80px)] shadow-xl">
        {currentView === 'dashboard' && <MerchantDashboard />}
        {currentView === 'agenda' && <AgendaView />}
        {currentView === 'settings' && <SettingsPanel />}
      </div>
    </div>
  );
};

export default Index;
