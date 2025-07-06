
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, Users } from 'lucide-react';
import TimeSlotPicker from './TimeSlotPicker';
import NewClientForm from './NewClientForm';

interface Client {
  id: string;
  name: string;
  phone: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price?: number;
}

interface NewAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NewAppointmentModal = ({ open, onClose, onSuccess }: NewAppointmentModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    serviceId: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: ''
  });

  // Carregar dados quando o modal abrir
  useEffect(() => {
    if (open && user) {
      loadData();
    }
  }, [open, user]);

  // Limpar formulário quando fechar
  useEffect(() => {
    if (!open) {
      setFormData({
        clientId: '',
        serviceId: '',
        appointmentDate: '',
        appointmentTime: '',
        notes: ''
      });
      setShowNewClientForm(false);
    }
  }, [open]);

  const loadData = async () => {
    if (!user) return;

    setDataLoading(true);
    try {
      const [clientsResponse, servicesResponse] = await Promise.all([
        supabase
          .from('clients')
          .select('id, name, phone')
          .eq('company_id', user.id)
          .order('name'),
        supabase
          .from('services')
          .select('id, name, duration, price')
          .eq('company_id', user.id)
          .eq('is_active', true)
          .order('name')
      ]);

      if (clientsResponse.data) {
        setClients(clientsResponse.data);
      }
      
      if (servicesResponse.data) {
        setServices(servicesResponse.data);
      }

      if (clientsResponse.error) {
        console.error('Erro ao carregar clientes:', clientsResponse.error);
      }
      
      if (servicesResponse.error) {
        console.error('Erro ao carregar serviços:', servicesResponse.error);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados necessários.",
        variant: "destructive"
      });
    } finally {
      setDataLoading(false);
    }
  };

  const handleCreateClient = async (clientData: { name: string; phone: string; email?: string; notes?: string }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          company_id: user.id,
          name: clientData.name,
          phone: clientData.phone,
          email: clientData.email,
          notes: clientData.notes
        })
        .select()
        .single();

      if (error) throw error;

      // Adicionar o novo cliente à lista
      const newClient = {
        id: data.id,
        name: data.name,
        phone: data.phone
      };
      
      setClients(prev => [...prev, newClient]);
      setFormData(prev => ({ ...prev, clientId: newClient.id }));
      setShowNewClientForm(false);

      toast({
        title: "Cliente criado!",
        description: `${clientData.name} foi adicionado com sucesso.`,
      });

    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o cliente.",
        variant: "destructive"
      });
    }
  };

  const validateForm = () => {
    if (!formData.clientId) {
      toast({
        title: "Erro",
        description: "Selecione um cliente.",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.serviceId) {
      toast({
        title: "Erro",
        description: "Selecione um serviço.",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.appointmentDate) {
      toast({
        title: "Erro",
        description: "Selecione uma data.",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.appointmentTime) {
      toast({
        title: "Erro",
        description: "Selecione um horário.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validateForm()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('appointments').insert({
        company_id: user.id,
        client_id: formData.clientId,
        service_id: formData.serviceId,
        appointment_date: formData.appointmentDate,
        appointment_time: formData.appointmentTime,
        notes: formData.notes.trim() || null,
        status: 'confirmed'
      });

      if (error) {
        console.error('Erro detalhado ao criar agendamento:', error);
        throw error;
      }

      toast({
        title: "Agendamento criado!",
        description: "O agendamento foi criado com sucesso.",
      });

      onSuccess();
      onClose();
      
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      
      let errorMessage = "Não foi possível criar o agendamento.";
      
      if (error.message?.includes('invalid input syntax for type uuid')) {
        errorMessage = "Erro nos dados selecionados. Tente selecionar novamente o cliente e serviço.";
      } else if (error.message?.includes('violates foreign key constraint')) {
        errorMessage = "Cliente ou serviço inválido. Verifique os dados e tente novamente.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const selectedService = services.find(s => s.id === formData.serviceId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl mx-3 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-whatsapp-green" />
            Novo Agendamento
          </DialogTitle>
        </DialogHeader>

        {dataLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green mx-auto"></div>
            <p className="mt-2 text-gray-500">Carregando dados...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção de Cliente */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="client">Cliente</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewClientForm(!showNewClientForm)}
                  className="h-8"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Novo Cliente
                </Button>
              </div>
              
              {showNewClientForm ? (
                <NewClientForm
                  onSubmit={handleCreateClient}
                  onCancel={() => setShowNewClientForm(false)}
                  loading={loading}
                />
              ) : (
                <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 ? (
                      <div className="p-3 text-center text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>Nenhum cliente cadastrado</p>
                        <p className="text-sm">Clique em "Novo Cliente" para criar um</p>
                      </div>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} - {client.phone}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Seleção de Serviço */}
            <div className="space-y-2">
              <Label htmlFor="service">Serviço</Label>
              <Select value={formData.serviceId} onValueChange={(value) => setFormData({ ...formData, serviceId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.length === 0 ? (
                    <div className="p-3 text-center text-gray-500">
                      <p>Nenhum serviço ativo encontrado</p>
                      <p className="text-sm">Configure seus serviços primeiro</p>
                    </div>
                  ) : (
                    services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.duration}min)
                        {service.price && ` - R$ ${service.price.toFixed(2)}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Seleção de Data */}
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value, appointmentTime: '' })}
                min={getMinDate()}
                required
              />
            </div>

            {/* Seleção de Horário */}
            <div className="space-y-2">
              <TimeSlotPicker
                selectedDate={formData.appointmentDate}
                selectedTime={formData.appointmentTime}
                onTimeSelect={(time) => setFormData({ ...formData, appointmentTime: time })}
                companyId={user?.id || ''}
                serviceId={formData.serviceId}
              />
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Digite observações sobre o agendamento..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Resumo do Agendamento */}
            {formData.clientId && formData.serviceId && formData.appointmentDate && formData.appointmentTime && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">Resumo do Agendamento</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Cliente:</strong> {clients.find(c => c.id === formData.clientId)?.name}</p>
                  <p><strong>Serviço:</strong> {selectedService?.name} ({selectedService?.duration}min)</p>
                  <p><strong>Data:</strong> {new Date(formData.appointmentDate).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Horário:</strong> {formData.appointmentTime}</p>
                  {selectedService?.price && (
                    <p><strong>Valor:</strong> R$ {selectedService.price.toFixed(2)}</p>
                  )}
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !formData.clientId || !formData.serviceId || !formData.appointmentDate || !formData.appointmentTime} 
                className="flex-1 bg-whatsapp-green hover:bg-whatsapp-green-dark"
              >
                {loading ? 'Criando...' : 'Criar Agendamento'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewAppointmentModal;
