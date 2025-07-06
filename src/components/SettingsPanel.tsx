
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Save, Settings, Clock, DollarSign, MapPin, Phone, Mail, Plus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const SettingsPanel = () => {
  const [businessInfo, setBusinessInfo] = useState({
    name: 'Salão Beleza & Estilo',
    address: 'Rua das Flores, 123 - Centro',
    phone: '(11) 99999-9999',
    email: 'contato@belezaestilo.com',
    description: 'Salão de beleza especializado em cortes, coloração e tratamentos capilares.',
    workingHours: 'Segunda a Sábado: 9h às 18h',
    notifications: true,
    autoConfirm: false
  });

  const [services, setServices] = useState([
    { id: 1, name: 'Corte Feminino', price: 35, duration: 45 },
    { id: 2, name: 'Corte Masculino', price: 25, duration: 30 },
    { id: 3, name: 'Escova', price: 30, duration: 60 },
    { id: 4, name: 'Coloração', price: 80, duration: 120 },
    { id: 5, name: 'Manicure', price: 20, duration: 45 },
    { id: 6, name: 'Pedicure', price: 25, duration: 60 }
  ]);

  const [newService, setNewService] = useState({ name: '', price: 0, duration: 30 });

  const handleSave = () => {
    toast({
      title: "Configurações salvas!",
      description: "Todas as alterações foram salvas com sucesso.",
    });
  };

  const addService = () => {
    if (newService.name) {
      setServices([...services, { ...newService, id: Date.now() }]);
      setNewService({ name: '', price: 0, duration: 30 });
      toast({
        title: "Serviço adicionado!",
        description: `${newService.name} foi adicionado à lista de serviços.`,
      });
    }
  };

  const removeService = (id: number) => {
    setServices(services.filter(s => s.id !== id));
    toast({
      title: "Serviço removido!",
      description: "O serviço foi removido da lista.",
    });
  };

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Configurações
        </h2>
        <p className="text-gray-600">Gerencie as informações do seu negócio e personalize seu agendamento</p>
      </div>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Informações do Negócio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="business-name">Nome do Negócio</Label>
              <Input
                id="business-name"
                value={businessInfo.name}
                onChange={(e) => setBusinessInfo(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="business-phone">Telefone</Label>
              <Input
                id="business-phone"
                value={businessInfo.phone}
                onChange={(e) => setBusinessInfo(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="business-email">E-mail</Label>
              <Input
                id="business-email"
                type="email"
                value={businessInfo.email}
                onChange={(e) => setBusinessInfo(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="working-hours">Horário de Funcionamento</Label>
              <Input
                id="working-hours"
                value={businessInfo.workingHours}
                onChange={(e) => setBusinessInfo(prev => ({ ...prev, workingHours: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="business-address">Endereço</Label>
            <Input
              id="business-address"
              value={businessInfo.address}
              onChange={(e) => setBusinessInfo(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="business-description">Descrição</Label>
            <Textarea
              id="business-description"
              value={businessInfo.description}
              onChange={(e) => setBusinessInfo(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Services Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Gerenciar Serviços
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Service */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-3">Adicionar Novo Serviço</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                placeholder="Nome do serviço"
                value={newService.name}
                onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="Preço (R$)"
                value={newService.price}
                onChange={(e) => setNewService(prev => ({ ...prev, price: Number(e.target.value) }))}
              />
              <Input
                type="number"
                placeholder="Duração (min)"
                value={newService.duration}
                onChange={(e) => setNewService(prev => ({ ...prev, duration: Number(e.target.value) }))}
              />
              <Button onClick={addService} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>

          {/* Services List */}
          <div className="space-y-2">
            {services.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4 flex-1">
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        R$ {service.price},00
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {service.duration} min
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeService(service.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Preferências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notificações por e-mail</p>
              <p className="text-sm text-gray-600">Receber notificações de novos agendamentos</p>
            </div>
            <Switch
              checked={businessInfo.notifications}
              onCheckedChange={(checked) => setBusinessInfo(prev => ({ ...prev, notifications: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Confirmação automática</p>
              <p className="text-sm text-gray-600">Confirmar agendamentos automaticamente</p>
            </div>
            <Switch
              checked={businessInfo.autoConfirm}
              onCheckedChange={(checked) => setBusinessInfo(prev => ({ ...prev, autoConfirm: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Public Link */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Seu Link Público</h3>
            <p className="text-gray-600">Este é o link que seus clientes usarão para fazer agendamentos:</p>
            <div className="bg-white p-3 rounded-lg border">
              <code className="text-primary font-mono">zapagenda.com/salao-beleza-estilo</code>
            </div>
            <Badge className="bg-green-100 text-green-800">Ativo</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="text-center">
        <Button onClick={handleSave} size="lg" className="bg-primary hover:bg-primary/90">
          <Save className="w-5 h-5 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default SettingsPanel;
