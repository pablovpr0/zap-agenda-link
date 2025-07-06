
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Calendar as CalendarIcon, Clock, User, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import TimeSlotPicker from './TimeSlotPicker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Service {
  id: string;
  name: string;
  duration: number;
  price?: number;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NewAppointmentModal = ({ isOpen, onClose, onSuccess }: NewAppointmentModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isNewClient, setIsNewClient] = useState(false);
  
  // New client form
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Carregar serviços
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      // Carregar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', user.id)
        .order('name');

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados necessários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedServiceId || !selectedDate || !selectedTime || (!selectedClientId && !isNewClient)) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (isNewClient && (!newClientName || !newClientPhone)) {
      toast({
        title: "Dados do cliente",
        description: "Nome e telefone são obrigatórios para novo cliente.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      let clientId = selectedClientId;

      // Criar novo cliente se necessário
      if (isNewClient) {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            company_id: user!.id,
            name: newClientName,
            phone: newClientPhone,
            email: newClientEmail || null,
          })
          .select('id')
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      // Buscar duração do serviço
      const service = services.find(s => s.id === selectedServiceId);
      
      // Verificar conflitos antes de criar (prevenção de race condition)
      const appointmentDate = format(selectedDate, 'yyyy-MM-dd');
      const { data: conflictCheck } = await supabase
        .from('appointments')
        .select('id')
        .eq('company_id', user!.id)
        .eq('appointment_date', appointmentDate)
        .eq('appointment_time', selectedTime)
        .neq('status', 'cancelled');

      if (conflictCheck && conflictCheck.length > 0) {
        toast({
          title: "Horário indisponível",
          description: "Este horário foi reservado por outro cliente. Escolha outro horário.",
          variant: "destructive",
        });
        return;
      }

      // Criar agendamento
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          company_id: user!.id,
          client_id: clientId,
          service_id: selectedServiceId,
          appointment_date: appointmentDate,
          appointment_time: selectedTime,
          duration: service?.duration || 60,
          status: 'confirmed',
          notes: notes || null,
        });

      if (appointmentError) throw appointmentError;

      toast({
        title: "Agendamento criado!",
        description: "O agendamento foi criado com sucesso.",
      });

      onSuccess();
      handleClose();

    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedServiceId('');
    setSelectedClientId('');
    setSelectedDate(undefined);
    setSelectedTime('');
    setNotes('');
    setIsNewClient(false);
    setNewClientName('');
    setNewClientPhone('');
    setNewClientEmail('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-whatsapp-green" />
            Novo Agendamento
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Serviço */}
            <div className="space-y-2">
              <Label htmlFor="service">Serviço *</Label>
              <Select value={selectedServiceId} onValueChange={setSelectedServiceId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{service.name}</span>
                        <div className="flex items-center gap-2 text-sm text-gray-600 ml-4">
                          <Clock className="w-3 h-3" />
                          {service.duration}min
                          {service.price && (
                            <span className="font-medium">
                              R$ {service.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cliente */}
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={!isNewClient ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsNewClient(false)}
                >
                  Cliente Existente
                </Button>
                <Button
                  type="button"
                  variant={isNewClient ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsNewClient(true)}
                >
                  Novo Cliente
                </Button>
              </div>

              {!isNewClient ? (
                <Select value={selectedClientId} onValueChange={setSelectedClientId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-gray-600">{client.phone}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newClientName">Nome *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="newClientName"
                        type="text"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="Nome completo"
                        className="pl-10"
                        required={isNewClient}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newClientPhone">Telefone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="newClientPhone"
                        type="tel"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="pl-10"
                        required={isNewClient}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="newClientEmail">E-mail (opcional)</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="newClientEmail"
                        type="email"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        placeholder="cliente@email.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Data com Calendar */}
            <div className="space-y-2">
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Horário */}
            {selectedDate && user && (
              <TimeSlotPicker
                selectedDate={format(selectedDate, 'yyyy-MM-dd')}
                selectedTime={selectedTime}
                onTimeSelect={setSelectedTime}
                companyId={user.id}
                serviceId={selectedServiceId}
              />
            )}

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre o agendamento..."
                rows={3}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-whatsapp-green hover:bg-green-600"
              >
                {submitting ? "Criando..." : "Criar Agendamento"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewAppointmentModal;
