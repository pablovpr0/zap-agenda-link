import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import CompanySettingsModal from '../CompanySettingsModal';
const WelcomeSection = () => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  return <>
      <div className="bg-white rounded-lg p-4 md:p-6 border border-whatsapp">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
              Olá! Bem-vindo ao seu painel
            </h2>
            <p className="text-whatsapp-muted">
              Gerencie seus agendamentos, clientes e configurações tudo em um só lugar.
            </p>
          </div>
          
          
        </div>
      </div>

      <CompanySettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} onSuccess={() => {
      // Poderia recarregar dados se necessário
      console.log('Configurações salvas com sucesso');
    }} />
    </>;
};
export default WelcomeSection;