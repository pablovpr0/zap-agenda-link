
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createAppointment } from '@/services/appointmentService';
import { useTimeSlotGeneration } from '@/hooks/useTimeSlotGeneration';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, User, Phone, Mail, FileText, Briefcase } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  services: Array<{ id: string; name: string; duration: number; price?: number }>;
  professionals: Array<{ id: string; name: string }>;
  onAppointmentCreated: () => void;
  onSuccess?: () => void;
  initialDate?: string;
  initialTime?: string;
}

const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  companyId,
  services,
  professionals,
  onAppointmentCreated,
  onSuccess,
  initialDate,
  initialTime
}) => {
  const { toast } = useToast();
  const { timeSlots, loading: timeSlotsLoading, generateTimeSlots } = useTimeSlotGeneration();

  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    serviceId: '',
    professionalId: '',
    date: initialDate ? new Date(initialDate) : null,
    time: initialTime || '',
    notes: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (formData.date && formData.serviceId) {
      generateTimeSlots(
        format(formData.date, 'yyyy-MM-dd'),
        companyId,
        formData.serviceId
      );
    }
  }, [formData.date, formData.serviceId, companyId, generateTimeSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName || !formData.clientPhone || !formData.serviceId || !formData.date || !formData.time) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createAppointment({
        company_id: companyId,
        client_name: formData.clientName,
        client_phone: formData.clientPhone,
        client_email: formData.clientEmail || undefined,
        service_id: formData.serviceId,
        professional_id: formData.professionalId || undefined,
        appointment_date: format(formData.date, 'yyyy-MM-dd'),
        appointment_time: formData.time,
        status: 'confirmed',
        notes: formData.notes || undefined
      });

      toast({
        title: "Agendamento criado",
        description: "O agendamento foi criado com sucesso.",
      });

      onAppointmentCreated();
      if (onSuccess) {
        onSuccess();
      }
      onClose();
      
      // Reset form
      setFormData({
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        serviceId: '',
        professionalId: '',
        date: null,
        time: '',
        notes: ''
      });

    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Erro ao criar agendamento",
        description: error.message || "Não foi possível criar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Novo Agendamento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cliente Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações do Cliente
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nome *</Label>
                <Input
                  id="clientName"
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Nome completo do cliente"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientPhone">Telefone *</Label>
                <Input
                  id="clientPhone"
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientEmail">Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={formData.clientEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                placeholder="cliente@email.com"
              />
            </div>
          </div>

          {/* Service and Professional */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Serviço
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service">Serviço *</Label>
                <Select 
                  value={formData.serviceId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, serviceId: value, time: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.duration}min)
                        {service.price && ` - R$ ${service.price.toFixed(2)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {professionals.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="professional">Profissional</Label>
                  <Select 
                    value={formData.professionalId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, professionalId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      {professionals.map((professional) => (
                        <SelectItem key={professional.id} value={professional.id}>
                          {professional.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Data e Horário
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? (
                        format(formData.date, "PPP", { locale: ptBR })
                      ) : (
                        "Selecione uma data"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => setFormData(prev => ({ ...prev, date: date || null, time: '' }))}
                      disabled={isDateDisabled}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Horário *</Label>
                <Select 
                  value={formData.time} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, time: value }))}
                  disabled={!formData.date || !formData.serviceId || timeSlotsLoading}
                >
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        !formData.date || !formData.serviceId 
                          ? "Selecione data e serviço primeiro"
                          : timeSlotsLoading 
                          ? "Carregando horários..."
                          : "Selecione um horário"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots
                      .filter(slot => slot.available)
                      .map((slot) => (
                        <SelectItem key={slot.time} value={slot.time}>
                          {slot.time}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Observações
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !formData.clientName || !formData.clientPhone || !formData.serviceId || !formData.date || !formData.time}
            >
              {isSubmitting ? "Criando..." : "Criar Agendamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewAppointmentModal;
