
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Briefcase, Plus, Clock, DollarSign, Search, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price?: number;
  is_active: boolean;
  created_at: string;
}

const ServiceManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 60,
    price: '',
    is_active: true
  });

  useEffect(() => {
    if (user) {
      loadServices();
    }
  }, [user]);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', user!.id)
        .order('name');

      if (error) throw error;
      setServices(data || []);
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

  const handleSaveService = async () => {
    if (!formData.name) {
      toast({
        title: "Erro",
        description: "Nome do serviço é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      const serviceData = {
        name: formData.name,
        description: formData.description || null,
        duration: formData.duration,
        price: formData.price ? parseFloat(formData.price) : null,
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      };

      if (editingService) {
        // Atualizar serviço existente
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);

        if (error) throw error;

        toast({
          title: "Sucesso!",
          description: "Serviço atualizado com sucesso.",
        });
      } else {
        // Criar novo serviço
        const { error } = await supabase
          .from('services')
          .insert({
            ...serviceData,
            company_id: user!.id
          });

        if (error) throw error;

        toast({
          title: "Sucesso!",
          description: "Serviço cadastrado com sucesso.",
        });
      }

      setDialogOpen(false);
      setEditingService(null);
      setFormData({ name: '', description: '', duration: 60, price: '', is_active: true });
      loadServices();
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o serviço.",
        variant: "destructive",
      });
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      duration: service.duration,
      price: service.price?.toString() || '',
      is_active: service.is_active
    });
    setDialogOpen(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Serviço excluído com sucesso.",
      });

      loadServices();
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o serviço.",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}min`;
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
            <Briefcase className="w-5 md:w-6 h-5 md:h-6 text-whatsapp-green" />
            Gerenciar Serviços
          </h2>
          <p className="text-whatsapp-muted text-sm">Configure os serviços que você oferece</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-whatsapp-green hover:bg-green-600 text-white"
              onClick={() => {
                setEditingService(null);
                setFormData({ name: '', description: '', duration: 60, price: '', is_active: true });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Serviço *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Corte de Cabelo"
                  className="border-whatsapp"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição do serviço..."
                  className="border-whatsapp"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duração (minutos) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                    min="15"
                    step="15"
                    className="border-whatsapp"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0,00"
                    className="border-whatsapp"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Serviço ativo</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSaveService}
                  className="flex-1 bg-whatsapp-green hover:bg-green-600 text-white"
                >
                  {editingService ? 'Atualizar' : 'Cadastrar'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  className="flex-1 border-whatsapp"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-whatsapp-muted w-4 h-4" />
        <Input
          placeholder="Buscar serviço..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-whatsapp"
        />
      </div>

      {/* Services List */}
      <Card className="bg-white border-whatsapp">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg text-gray-800">
            Serviços Cadastrados ({filteredServices.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          {filteredServices.length === 0 ? (
            <div className="text-center py-8 text-whatsapp-muted">
              <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              {searchTerm ? (
                <p>Nenhum serviço encontrado para "{searchTerm}"</p>
              ) : (
                <>
                  <p>Nenhum serviço cadastrado ainda</p>
                  <p className="text-sm">Comece cadastrando seus serviços</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-3 border border-whatsapp rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-800 truncate">{service.name}</p>
                      {!service.is_active && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Inativo</span>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-sm text-whatsapp-muted mb-2 truncate">{service.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-whatsapp-muted">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(service.duration)}</span>
                      </div>
                      {service.price && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          <span>R$ {service.price.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditService(service)}
                      className="border-whatsapp"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteService(service.id)}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceManagement;
