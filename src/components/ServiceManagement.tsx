
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Edit, DollarSign, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

interface Service {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  is_active: boolean;
}

const ServiceManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
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
      const { data: servicesData, error } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        devError('Erro ao carregar serviços:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os serviços.",
          variant: "destructive",
        });
        return;
      }

      setServices(servicesData || []);
    } catch (error) {
      devError('Erro ao carregar serviços:', error);
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
      const { data, error } = await supabase
        .from('services')
        .insert({
          company_id: user!.id,
          name: newServiceName,
          description: newServiceDescription,
          duration: parseInt(newServiceDuration),
          price: parseFloat(newServicePrice),
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setServices([data, ...services]);
      setNewServiceName('');
      setNewServiceDescription('');
      setNewServiceDuration('');
      setNewServicePrice('');

      toast({
        title: "Serviço criado",
        description: "Serviço criado com sucesso.",
      });
    } catch (error) {
      devError('Erro ao criar serviço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o serviço.",
        variant: "destructive",
      });
    }
  };

  const handleEditService = (service: Service) => {
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
      const { error } = await supabase
        .from('services')
        .update({
          name: editedServiceName,
          description: editedServiceDescription,
          duration: parseInt(editedServiceDuration),
          price: parseFloat(editedServicePrice)
        })
        .eq('id', editingServiceId);

      if (error) throw error;

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

      setServices(updatedServices);
      setEditingServiceId(null);

      toast({
        title: "Serviço atualizado",
        description: "Serviço atualizado com sucesso.",
      });
    } catch (error) {
      devError('Erro ao atualizar serviço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o serviço.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', serviceId);

      if (error) throw error;

      setServices(services.filter(service => service.id !== serviceId));

      toast({
        title: "Serviço excluído",
        description: "Serviço excluído com sucesso.",
      });
    } catch (error) {
      devError('Erro ao excluir serviço:', error);
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
        <CardHeader>
          <CardTitle>Gerenciar Serviços</CardTitle>
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
                <Label htmlFor="new-service-price">Preço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  id="new-service-price"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                  placeholder="0,00"
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
                <CardContent className="p-4">
                  {editingServiceId === service.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Nome</Label>
                          <Input
                            type="text"
                            value={editedServiceName}
                            onChange={(e) => setEditedServiceName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Duração (min)</Label>
                          <Input
                            type="number"
                            value={editedServiceDuration}
                            onChange={(e) => setEditedServiceDuration(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Preço (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={editedServicePrice}
                            onChange={(e) => setEditedServicePrice(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea
                          value={editedServiceDescription}
                          onChange={(e) => setEditedServiceDescription(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button onClick={handleUpdateService}>
                          Salvar
                        </Button>
                        <Button variant="ghost" onClick={() => setEditingServiceId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{service.name}</h4>
                        <p className="text-sm text-gray-500 mb-2">{service.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {service.duration} min
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            R$ {service.price.toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          onClick={() => handleEditService(service)}
                          className="w-full sm:w-auto text-sm"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="w-full sm:w-auto text-sm"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
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
                      </div>
                    </div>
                  )}
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
