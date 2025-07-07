
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Settings } from 'lucide-react';

const ManagementSection = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white border-whatsapp">
        <CardContent className="p-4 text-center">
          <Users className="w-8 h-8 text-whatsapp-green mx-auto mb-2" />
          <h3 className="font-medium mb-1 text-gray-800">Clientes</h3>
          <p className="text-sm text-whatsapp-muted mb-3">Gerencie sua base de clientes</p>
          <Button variant="outline" size="sm" className="w-full border-whatsapp">
            Gerenciar Clientes
          </Button>
        </CardContent>
      </Card>
      
      <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white border-whatsapp">
        <CardContent className="p-4 text-center">
          <Settings className="w-8 h-8 text-whatsapp-green mx-auto mb-2" />
          <h3 className="font-medium mb-1 text-gray-800">Serviços</h3>
          <p className="text-sm text-whatsapp-muted mb-3">Configure seus serviços e preços</p>
          <Button variant="outline" size="sm" className="w-full border-whatsapp">
            Gerenciar Serviços
          </Button>
        </CardContent>
      </Card>
      
      <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white border-whatsapp">
        <CardContent className="p-4 text-center">
          <Users className="w-8 h-8 text-whatsapp-green mx-auto mb-2" />
          <h3 className="font-medium mb-1 text-gray-800">Profissionais</h3>
          <p className="text-sm text-whatsapp-muted mb-3">Cadastre sua equipe</p>
          <Button variant="outline" size="sm" className="w-full border-whatsapp">
            Gerenciar Equipe
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagementSection;
