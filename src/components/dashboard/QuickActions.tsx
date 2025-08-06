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
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white border-whatsapp" onClick={onNewAppointment}>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Plus className="w-5 h-5 text-whatsapp-green" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Novo Agendamento</h3>
              <p className="text-sm text-whatsapp-muted">Criar agendamento manual</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white border-whatsapp" onClick={onViewPublicPage}>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ExternalLink className="w-5 h-5 text-whatsapp-green" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Página do Cliente</h3>
              <p className="text-sm text-whatsapp-muted">Ver página pública</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white border-whatsapp" onClick={onManageClients}>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-whatsapp-green" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Gerenciar Clientes</h3>
              <p className="text-sm text-whatsapp-muted">Ver todos os clientes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white border-whatsapp" onClick={onShowSettings}>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800"> Configurações</h3>
              <p className="text-sm text-whatsapp-muted">Horários e configurações</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default QuickActions;