
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Clock, User, Phone, Mail, MessageSquare } from 'lucide-react';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NewAppointmentModal = ({ isOpen, onClose, onSuccess }: NewAppointmentModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  
  // Form state
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  
  // New client form
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      loadInitialData();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (selectedDate && user) {
      loadAvailableTimes();
    }
  }, [selectedDate, user]);

  const loadInitialData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', user.id)
        .order('name');

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Load services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

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

  const loadAvailableTimes = async () => {
    if (!user || !selectedDate) return;

    try {
      // Buscar configurações da empresa
      const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('working_hours_start, working_hours_end, appointment_interval')
        .eq('company_id', user.id)
        .single();

      if (settingsError) throw settingsError;

      // Gerar horários disponíveis
      const times = [];
      const [startHour, startMinute] = settings.working_hours_start.split(':').map(Number);
      const [endHour, endMinute] = settings.working_hours_end.split(':').map(Number);
      
      let currentTime = new Date();
      currentTime.setHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date();
      endTime.setHours(endHour, endMinute, 0, 0);
      
      while (currentTime < endTime) {
        times.push(format(currentTime, 'HH:mm'));
        currentTime = new Date(currentTime.getTime() + settings.appointment_interval * 60000);
      }

      // Buscar horários já agendados para esta data
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data: bookedAppointments, error: bookedError } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('company_id', user.id)
        .eq('appointment_date', dateStr)
        .neq('status', 'cancelled');

      if (bookedError) throw bookedError;

      // Filtrar horários já ocupados
      const bookedTimes = bookedAppointments?.map(apt => apt.appointment_time.substring(0, 5)) || [];
      const availableTimesList = times.filter(time => !bookedTimes.includes(time));
      
      setAvailableTimes(availableTimesList);

    } catch (error: any) {
      console.error('Erro ao carregar horários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os horários disponíveis.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !selectedService) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedClient && !isNewClient) {
      toast({
        title: "Cliente obrigatório",
        description: "Selecione um cliente ou cadastre um novo.",
        variant: "destructive",
      });
      return;
    }

    if (isNewClient && (!newClientName || !newClientPhone)) {
      toast({
        title: "Dados do cliente",
        description: "Nome e telefone são obrigatórios para novos clientes.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      let clientId = selectedClient;

      // Create new client if needed
      if (isNewClient) {
        // Verificar se já existe cliente com esse telefone
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('company_id', user!.id)
          .eq('phone', newClientPhone)
          .maybeSingle();

        if (existingClient) {
          clientId = existingClient.id;
          // Atualizar dados do cliente existente
          await supabase
            .from('clients')
            .update({
              name: newClientName,
              email: newClientEmail || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', clientId);
        } else {
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
      }

      // Verificar se horário ainda está disponível
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data: conflictCheck } = await supabase
        .from('appointments')
        .select('id')
        .eq('company_id', user!.id)
        .eq('appointment_date', dateStr)
        .eq('appointment_time', selectedTime)
        .neq('status', 'cancelled');

      if (conflictCheck && conflictCheck.length > 0) {
        toast({
          title: "Horário indisponível",
          description: "Este horário já foi ocupado. Por favor, escolha outro horário.",
          variant: "destructive",
        });
        await loadAvailableTimes(); // Recarregar horários
        return;
      }

      // Create appointment
      const service = services.find(s => s.id === selectedService);
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          company_id: user!.id,
          client_id: clientId,
          service_id: selectedService,
          appointment_date: dateStr,
          appointment_time: selectedTime,
          duration: service?.duration || 60,
          status: 'confirmed',
          notes: notes || null,
        });

      if (appointmentError) throw appointmentError;

      toast({
        title: "Agendamento criado!",
        description: `Agendamento criado para ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} às ${selectedTime}.`,
      });

      onSuccess();
      onClose();
      resetForm();

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

  const resetForm = () => {
    setSelectedClient('');
    setSelectedService('');
    setSelectedDate(undefined);
    setSelectedTime('');
    setNotes('');
    setIsNewClient(false);
    setNewClientName('');
    setNewClientPhone('');
    setNewClientEmail('');
    setAvailableTimes([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-whatsapp-green" />
            Novo Agendamento
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4 text-whatsapp-green" />
                Cliente
              </Label>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={!isNewClient ? "default" : "outline"}
                  onClick={() => setIsNewClient(false)}
                  className="flex-1"
                >
                  Cliente Existente
                </Button>
                <Button
                  type="button"
                  variant={isNewClient ? "default" : "outline"}
                  onClick={() => setIsNewClient(true)}
                  className="flex-1"
                >
                  Novo Cliente
                </Button>
              </div>

              {!isNewClient ? (
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
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
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="newClientName">Nome *</Label>
                      <Input
                        id="newClientName"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="Nome do cliente"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="newClientPhone">Telefone *</Label>
                      <Input
                        id="newClientPhone"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="newClientEmail">E-mail</Label>
                    <Input
                      id="newClientEmail"
                      type="email"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Service Selection */}
            <div className="space-y-2">
              <Label>Serviço</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - {service.duration}min
                      {service.price && ` - R$ ${service.price}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-whatsapp-green" />
                Data
              </Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date.getDay() === 0}
                className="rounded-md border"
              />
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-whatsapp-green" />
                  Horário
                </Label>
                {availableTimes.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                    Nenhum horário disponível para esta data
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableTimes.map((time) => (
                      <Button
                        key={time}
                        type="button"
                        variant={selectedTime === time ? "default" : "outline"}
                        onClick={() => setSelectedTime(time)}
                        className="text-sm"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-whatsapp-green" />
                Observações
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações adicionais (opcional)"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
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
