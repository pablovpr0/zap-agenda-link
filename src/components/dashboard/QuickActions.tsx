import { Card, CardContent } from '@/components/ui/card';
import { Plus, ExternalLink, Users, Settings } from 'lucide-react';

interface QuickActionsProps {
  onNewAppointment: () => void;
  onViewPublicPage: () => void;
  onManageClients: () => void;
  onShowSettings: () => void;
}

const QuickActions = ({
  onNewAppointment,
  onViewPublicPage,
  onManageClients,
  onShowSettings
}: QuickActionsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
      <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white border-whatsapp overflow-hidden" onClick={onNewAppointment}>
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
              <Plus className="w-4 md:w-5 h-4 md:h-5 text-whatsapp-green" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-800 text-sm md:text-base truncate">Novo Agendamento</h3>
              <p className="text-xs md:text-sm text-whatsapp-muted truncate">Criar agendamento manual</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white border-whatsapp overflow-hidden" onClick={onViewPublicPage}>
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
              <ExternalLink className="w-4 md:w-5 h-4 md:h-5 text-whatsapp-green" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-800 text-sm md:text-base truncate">Página do Cliente</h3>
              <p className="text-xs md:text-sm text-whatsapp-muted truncate">Ver página pública</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white border-whatsapp overflow-hidden" onClick={onManageClients}>
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
              <Users className="w-4 md:w-5 h-4 md:h-5 text-whatsapp-green" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-800 text-sm md:text-base truncate">Gerenciar Clientes</h3>
              <p className="text-xs md:text-sm text-whatsapp-muted truncate">Ver todos os clientes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white border-whatsapp overflow-hidden" onClick={onShowSettings}>
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
              <Settings className="w-4 md:w-5 h-4 md:h-5 text-whatsapp-green" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-800 text-sm md:text-base truncate">Configurações</h3>
              <p className="text-xs md:text-sm text-whatsapp-muted truncate">Horários e configurações</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickActions;