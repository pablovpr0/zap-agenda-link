
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StandardCalendar from './StandardCalendar';
import NewClientForm from './NewClientForm';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price?: number;
}

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preSelectedDate?: string;
  preSelectedTime?: string;
}

const NewAppointmentModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  preSelectedDate,
  preSelectedTime 
}: NewAppointmentModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState(preSelectedDate || '');
  const [selectedTime, setSelectedTime] = useState(preSelectedTime || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadClients();
      loadServices();
    }
  }, [isOpen, user]);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, phone, email')
        .eq('company_id', user!.id)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, duration, price')
        .eq('company_id', user!.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  };

  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 60; i++) {
      const date = addDays(today, i);
      // Incluir todos os dias por enquanto - você pode adicionar lógica específica aqui
      dates.push(date);
    }
    
    return dates;
  };

  const generateAvailableTimes = () => {
    const times = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return times;
  };

  const handleCreateClient = async (clientData: { name: string; phone: string; email?: string; notes?: string }) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          company_id: user!.id,
          name: clientData.name,
          phone: clientData.phone,
          email: clientData.email || null,
          notes: clientData.notes || null
        })
        .select('id, name, phone, email')
        .single();

      if (error) throw error;

      // Adicionar o novo cliente à lista
      setClients(prev => [...prev, data]);
      setSelectedClient(data.id);
      setShowNewClientForm(false);

      toast({
        title: "Sucesso!",
        description: "Cliente cadastrado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o cliente.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient || !selectedService || !selectedDate || !selectedTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          company_id: user!.id,
          client_id: selectedClient,
          service_id: selectedService,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          notes: notes || null,
          status: 'confirmed'
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Agendamento criado com sucesso.",
      });

      onSuccess();
      onClose();
      
      // Limpar formulário
      setSelectedClient('');
      setSelectedService('');
      setSelectedDate('');
      setSelectedTime('');
      setNotes('');
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o agendamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const availableDates = generateAvailableDates();
  const availableTimes = generateAvailableTimes();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Novo Agendamento
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cliente */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Cliente *</Label>
            {showNewClientForm ? (
              <NewClientForm
                onSubmit={handleCreateClient}
                onCancel={() => setShowNewClientForm(false)}
              />
            ) : (
              <div className="flex gap-2">
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewClientForm(true)}
                  className="whitespace-nowrap"
                >
                  <User className="w-4 h-4 mr-2" />
                  Novo
                </Button>
              </div>
            )}
          </div>

          {/* Serviço */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Serviço *</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} ({service.duration}min)
                    {service.price && ` - R$ ${service.price}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Data *</Label>
            <StandardCalendar
              availableDates={availableDates}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              showNavigation={true}
              highlightToday={true}
            />
          </div>

          {/* Horário */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Horário *</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um horário" />
              </SelectTrigger>
              <SelectContent>
                {availableTimes.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre o agendamento..."
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar Agendamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewAppointmentModal;
