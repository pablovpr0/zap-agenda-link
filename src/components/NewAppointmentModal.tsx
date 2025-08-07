import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CalendarIcon, Clock, User, Phone, Plus, Search, UserPlus, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

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
  price: number;
  description?: string;
}

interface Professional {
  id: string;
  name: string;
  phone: string;
}

const NewAppointmentModal = ({ isOpen, onClose, onSuccess }: NewAppointmentModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Client selection states
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [isNewClient, setIsNewClient] = useState(false);
  const [showClientSelector, setShowClientSelector] = useState(false);
  
  // New client form states
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  // Service and appointment states
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadInitialData();
      resetForm();
    }
  }, [isOpen, user]);

  // Load available times when date and service change
  useEffect(() => {
    if (selectedDate && selectedService && user) {
      loadAvailableTimes();
    }
  }, [selectedDate, selectedService, user]);

  const resetForm = () => {
    setSelectedClient(null);
    setClientSearchTerm('');
    setIsNewClient(false);
    setShowClientSelector(false);
    setNewClientName('');
    setNewClientPhone('');
    setNewClientEmail('');
    setSelectedService(null);
    setSelectedProfessional('');
    setSelectedDate(undefined);
    setSelectedTime('');
    setAvailableTimes([]);
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadClients(),
        loadServices(),
        loadProfessionals()
      ]);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
    setLoadingServices(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, duration, price, description')
        .eq('company_id', user!.id)
        .eq('is_active', true)
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
      setLoadingServices(false);
    }
  };

  const loadProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id, name, phone')
        .eq('company_id', user!.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProfessionals(data || []);
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
    }
  };

  const loadAvailableTimes = async () => {
    if (!selectedDate || !selectedService) return;

    setLoadingTimes(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd', { timeZone: 'America/Sao_Paulo' });
      
      // Import the updated checkAvailableTimes function
      const { checkAvailableTimes } = await import('@/services/publicBookingService');
      
      // Get available times using the new daily schedule system
      const times = await checkAvailableTimes(
        user!.id,
        formattedDate,
        selectedService.duration
      );

      setAvailableTimes(times);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os horários disponíveis.",
        variant: "destructive",
      });
      setAvailableTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!selectedService || !selectedDate || !selectedTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione serviço, data e horário.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedClient && (!newClientName || !newClientPhone)) {
      toast({
        title: "Cliente obrigatório",
        description: "Selecione um cliente existente ou preencha os dados do novo cliente.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      let clientId = selectedClient?.id;

      // Create new client if needed
      if (!selectedClient && isNewClient) {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            company_id: user!.id,
            name: newClientName,
            phone: newClientPhone,
            email: newClientEmail || null
          })
          .select()
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      // Create appointment
      const formattedDate = format(selectedDate, 'yyyy-MM-dd', { timeZone: 'America/Sao_Paulo' });
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          company_id: user!.id,
          client_id: clientId,
          service_id: selectedService.id,
          professional_id: selectedProfessional || null,
          appointment_date: formattedDate,
          appointment_time: selectedTime,
          duration: selectedService.duration,
          status: 'confirmed'
        });

      if (appointmentError) throw appointmentError;

      toast({
        title: "Agendamento criado!",
        description: "O agendamento foi criado com sucesso.",
      });

      onSuccess();
      onClose();

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

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    client.phone.includes(clientSearchTerm)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-whatsapp-green" />
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
              <Label className="text-sm font-medium">Cliente</Label>
              
              {!selectedClient ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={!isNewClient ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setIsNewClient(false);
                        setShowClientSelector(true);
                      }}
                      className="flex-1"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Cliente Existente
                    </Button>
                    <Button
                      type="button"
                      variant={isNewClient ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setIsNewClient(true);
                        setShowClientSelector(false);
                      }}
                      className="flex-1"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Novo Cliente
                    </Button>
                  </div>

                  {/* Existing Client Selector */}
                  {!isNewClient && (
                    <Popover open={showClientSelector} onOpenChange={setShowClientSelector}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          <span className="flex items-center">
                            <Search className="w-4 h-4 mr-2" />
                            {selectedClient ? selectedClient.name : "Buscar cliente..."}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Digite nome ou telefone..."
                            value={clientSearchTerm}
                            onValueChange={setClientSearchTerm}
                          />
                          <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                          <CommandGroup className="max-h-48 overflow-y-auto">
                            {filteredClients.map((client) => (
                              <CommandItem
                                key={client.id}
                                onSelect={() => {
                                  setSelectedClient(client);
                                  setShowClientSelector(false);
                                }}
                                className="flex items-center justify-between"
                              >
                                <div>
                                  <div className="font-medium">{client.name}</div>
                                  <div className="text-sm text-gray-500">{client.phone}</div>
                                </div>
                                {selectedClient?.id === client.id && (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}

                  {/* New Client Form */}
                  {isNewClient && (
                    <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                      <div>
                        <Label htmlFor="new-client-name" className="text-sm">Nome *</Label>
                        <Input
                          id="new-client-name"
                          placeholder="Nome completo"
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-client-phone" className="text-sm">Telefone *</Label>
                        <Input
                          id="new-client-phone"
                          placeholder="(XX) XXXXX-XXXX"
                          value={newClientPhone}
                          onChange={(e) => setNewClientPhone(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-client-email" className="text-sm">Email</Label>
                        <Input
                          id="new-client-email"
                          type="email"
                          placeholder="email@exemplo.com"
                          value={newClientEmail}
                          onChange={(e) => setNewClientEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                  <div>
                    <div className="font-medium text-green-800">{selectedClient.name}</div>
                    <div className="text-sm text-green-600">{selectedClient.phone}</div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedClient(null)}
                    className="text-green-600 hover:text-green-800"
                  >
                    Alterar
                  </Button>
                </div>
              )}
            </div>

            {/* Service Selection */}
            <div className="space-y-2">
              <Label>Serviço *</Label>
              {loadingServices ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-whatsapp-green"></div>
                  <span className="ml-2 text-sm">Carregando serviços...</span>
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">Nenhum serviço cadastrado</p>
                  <p className="text-xs">Cadastre serviços primeiro</p>
                </div>
              ) : (
                <Select 
                  value={selectedService?.id || ''} 
                  onValueChange={(value) => {
                    const service = services.find(s => s.id === value);
                    setSelectedService(service || null);
                    setSelectedTime(''); // Reset time when service changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{service.name}</span>
                          <div className="flex items-center gap-2 ml-2">
                            <Badge variant="secondary" className="text-xs">
                              {service.duration}min
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              R$ {service.price.toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Professional Selection (Optional) */}
            {professionals.length > 0 && (
              <div className="space-y-2">
                <Label>Profissional (Opcional)</Label>
                <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Qualquer profissional</SelectItem>
                    {professionals.map((professional) => (
                      <SelectItem key={professional.id} value={professional.id}>
                        {professional.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Selection */}
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
                    {selectedDate ? (
                      format(selectedDate, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setSelectedTime(''); // Reset time when date changes
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Selection */}
            {selectedDate && selectedService && (
              <div className="space-y-2">
                <Label>Horário *</Label>
                {loadingTimes ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-whatsapp-green"></div>
                    <span className="ml-2 text-sm">Carregando horários...</span>
                  </div>
                ) : availableTimes.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Nenhum horário disponível</p>
                    <p className="text-xs">Tente outra data ou serviço</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                    {availableTimes.map((time) => (
                      <Button
                        key={time}
                        type="button"
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
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

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-whatsapp-green hover:bg-green-600"
              disabled={submitting || !selectedService || !selectedDate || !selectedTime || (!selectedClient && (!newClientName || !newClientPhone))}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando...
                </>
              ) : (
                "Criar Agendamento"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewAppointmentModal;
