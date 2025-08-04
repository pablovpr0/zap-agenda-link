import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CalendarIcon, Clock, User, Phone, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';
import { getStorageData, setStorageData, MockClient, MockService, MockProfessional, MockAppointment, STORAGE_KEYS } from '@/data/mockData';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NewAppointmentModal = ({ isOpen, onClose, onSuccess }: NewAppointmentModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [services, setServices] = useState<MockService[]>([]);
  const [professionals, setProfessionals] = useState<MockProfessional[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const servicesData = getStorageData<MockService[]>(STORAGE_KEYS.SERVICES, []);
      const professionalsData = getStorageData<MockProfessional[]>(STORAGE_KEYS.PROFESSIONALS, []);

      // Filter services and professionals by company_id
      const filteredServices = servicesData.filter(service => service.company_id === user?.id && service.is_active);
      const filteredProfessionals = professionalsData.filter(professional => professional.company_id === user?.id && professional.is_active);

      setServices(filteredServices);
      setProfessionals(filteredProfessionals);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName || !clientPhone || !selectedService || !selectedDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Format the selected date to 'YYYY-MM-DD'
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      // Create or find client
      let clientId;
      const clients = getStorageData<MockClient[]>(STORAGE_KEYS.CLIENTS, []);
      let existingClient = clients.find(client => client.company_id === user?.id && client.phone === clientPhone);

      if (existingClient) {
        clientId = existingClient.id;
        // Update existing client
        existingClient = { ...existingClient, name: clientName };
        const updatedClients = clients.map(client => client.id === clientId ? existingClient! : client);
        setStorageData(STORAGE_KEYS.CLIENTS, updatedClients);
      } else {
        // Create new client
        clientId = `client-${Date.now()}`;
        const newClient: MockClient = {
          id: clientId,
          company_id: user!.id,
          name: clientName,
          phone: clientPhone,
          created_at: new Date().toISOString()
        };
        clients.push(newClient);
        setStorageData(STORAGE_KEYS.CLIENTS, clients);
      }

      // Create appointment
      const appointmentId = `appointment-${Date.now()}`;
      const newAppointment: MockAppointment = {
        id: appointmentId,
        company_id: user!.id,
        client_id: clientId,
        service_id: selectedService,
        professional_id: selectedProfessional || undefined,
        appointment_date: formattedDate,
        appointment_time: '09:00', // Mock time
        duration: 60, // Mock duration
        status: 'confirmed',
        created_at: new Date().toISOString()
      };

      const appointments = getStorageData<MockAppointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
      appointments.push(newAppointment);
      setStorageData(STORAGE_KEYS.APPOINTMENTS, appointments);

      toast({
        title: "Agendamento criado!",
        description: "O agendamento foi criado com sucesso.",
      });

      onSuccess();
      onClose();

    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

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
            {/* Client Name */}
            <div className="space-y-2">
              <Label htmlFor="client-name">Nome do Cliente</Label>
              <Input
                id="client-name"
                type="text"
                placeholder="Nome completo do cliente"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>

            {/* Client Phone */}
            <div className="space-y-2">
              <Label htmlFor="client-phone">Telefone do Cliente</Label>
              <Input
                id="client-phone"
                type="tel"
                placeholder="(XX) XXXX-XXXX"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                required
              />
            </div>

            {/* Service Selection */}
            <div className="space-y-2">
              <Label htmlFor="service">Serviço</Label>
              <Select value={selectedService} onValueChange={setSelectedService} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            {/* Date Selection */}
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
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
                <PopoverContent className="w-auto p-0" align="center" side="bottom">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) =>
                      date < new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-whatsapp-green hover:bg-green-600"
              disabled={submitting}
            >
              {submitting ? "Criando..." : "Criar Agendamento"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewAppointmentModal;
