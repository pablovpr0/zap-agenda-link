import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Edit, DollarSign, Clock, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getStorageData, setStorageData, MockService, STORAGE_KEYS } from '@/data/mockData';

const ServiceManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<MockService[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editedServiceName, setEditedServiceName] = useState('');
  const [editedServiceDescription, setEditedServiceDescription] = useState('');
  const [editedServiceDuration, setEditedServiceDuration] = useState('');
  const [editedServicePrice, setEditedServicePrice] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadServices();
    }
  }, [user]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const storedServices = getStorageData<MockService[]>(STORAGE_KEYS.SERVICES, []);
      const userServices = storedServices.filter(service => service.company_id === user?.id && service.is_active);
      setServices(userServices);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os serviços.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async () => {
    if (!newServiceName || !newServiceDuration || !newServicePrice) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newService: MockService = {
        id: `service-${Date.now()}`,
        company_id: user!.id,
        name: newServiceName,
        description: newServiceDescription,
        duration: parseInt(newServiceDuration),
        price: parseFloat(newServicePrice),
        is_active: true
      };

      const updatedServices = [...services, newService];
      setStorageData(STORAGE_KEYS.SERVICES, updatedServices);
      setServices(updatedServices.filter(service => service.company_id === user?.id && service.is_active));

      setNewServiceName('');
      setNewServiceDescription('');
      setNewServiceDuration('');
      setNewServicePrice('');

      toast({
        title: "Serviço criado",
        description: "Serviço criado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o serviço.",
        variant: "destructive",
      });
    }
  };

  const handleEditService = (service: MockService) => {
    setEditingServiceId(service.id);
    setEditedServiceName(service.name);
    setEditedServiceDescription(service.description || '');
    setEditedServiceDuration(service.duration.toString());
    setEditedServicePrice(service.price.toString());
  };

  const handleUpdateService = async () => {
    if (!editedServiceName || !editedServiceDuration || !editedServicePrice) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedServices = services.map(service =>
        service.id === editingServiceId
          ? {
              ...service,
              name: editedServiceName,
              description: editedServiceDescription,
              duration: parseInt(editedServiceDuration),
              price: parseFloat(editedServicePrice)
            }
          : service
      );

      setStorageData(STORAGE_KEYS.SERVICES, updatedServices);
      setServices(updatedServices.filter(service => service.company_id === user?.id && service.is_active));
      setEditingServiceId(null);

      toast({
        title: "Serviço atualizado",
        description: "Serviço atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o serviço.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const updatedServices = services.map(service =>
        service.id === serviceId ? { ...service, is_active: false } : service
      );

      setStorageData(STORAGE_KEYS.SERVICES, updatedServices);
      setServices(updatedServices.filter(service => service.company_id === user?.id && service.is_active));

      toast({
        title: "Serviço excluído",
        description: "Serviço excluído com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o serviço.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-4">Carregando serviços...</div>;
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Gerenciar Serviços</CardTitle>
          <Button onClick={() => {}}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Serviço
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {/* Create Service Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 md:col-span-3">
                <h3 className="text-lg font-semibold">Novo Serviço</h3>
              </div>
              <div>
                <Label htmlFor="new-service-name">Nome</Label>
                <Input
                  type="text"
                  id="new-service-name"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="new-service-duration">Duração (min)</Label>
                <Input
                  type="number"
                  id="new-service-duration"
                  value={newServiceDuration}
                  onChange={(e) => setNewServiceDuration(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="new-service-price">Preço</Label>
                <Input
                  type="number"
                  id="new-service-price"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                />
              </div>
              <div className="col-span-1 md:col-span-3">
                <Label htmlFor="new-service-description">Descrição</Label>
                <Textarea
                  id="new-service-description"
                  value={newServiceDescription}
                  onChange={(e) => setNewServiceDescription(e.target.value)}
                />
              </div>
              <div className="md:col-span-3">
                <Button className="w-full" onClick={handleCreateService}>
                  Criar Serviço
                </Button>
              </div>
            </div>

            <Separator />

            {/* Service List */}
            {services.map((service) => (
              <Card key={service.id}>
                <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div className="md:col-span-2">
                    <h4 className="font-semibold">{service.name}</h4>
                    <p className="text-sm text-gray-500">{service.description}</p>
                  </div>
                  <div>
                    <Badge variant="secondary">
                      <Clock className="w-3 h-3 mr-1" />
                      {service.duration} min
                    </Badge>
                  </div>
                  <div>
                    <Badge variant="outline">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {service.price}
                    </Badge>
                  </div>
                  <div className="md:col-span-4 flex justify-end gap-2">
                    {editingServiceId === service.id ? (
                      <>
                        <Input
                          type="text"
                          value={editedServiceName}
                          onChange={(e) => setEditedServiceName(e.target.value)}
                          placeholder="Nome"
                        />
                        <Input
                          type="text"
                          value={editedServiceDuration}
                          onChange={(e) => setEditedServiceDuration(e.target.value)}
                          placeholder="Duração"
                        />
                        <Input
                          type="text"
                          value={editedServicePrice}
                          onChange={(e) => setEditedServicePrice(e.target.value)}
                          placeholder="Preço"
                        />
                        <Textarea
                          value={editedServiceDescription}
                          onChange={(e) => setEditedServiceDescription(e.target.value)}
                          placeholder="Descrição"
                        />
                        <Button size="sm" onClick={handleUpdateService}>
                          Salvar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingServiceId(null)}>
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => handleEditService(service)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação irá excluir o serviço permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteService(service.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {services.length === 0 && (
              <div className="text-center text-gray-500">Nenhum serviço cadastrado.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceManagement;
