
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Clock, Calendar, Phone, Users } from 'lucide-react';

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CompanySettingsModal = ({ isOpen, onClose, onSuccess }: CompanySettingsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [workingHoursStart, setWorkingHoursStart] = useState('09:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('18:00');
  const [appointmentInterval, setAppointmentInterval] = useState(30);
  const [maxSimultaneousAppointments, setMaxSimultaneousAppointments] = useState(1);
  const [advanceBookingLimit, setAdvanceBookingLimit] = useState(30);
  const [monthlyAppointmentsLimit, setMonthlyAppointmentsLimit] = useState(4);
  const [phone, setPhone] = useState('');

  const weekDays = [
    { id: 1, name: 'Segunda-feira' },
    { id: 2, name: 'Terça-feira' },
    { id: 3, name: 'Quarta-feira' },
    { id: 4, name: 'Quinta-feira' },
    { id: 5, name: 'Sexta-feira' },
    { id: 6, name: 'Sábado' },
    { id: 7, name: 'Domingo' },
  ];

  useEffect(() => {
    if (isOpen && user) {
      loadSettings();
    }
  }, [isOpen, user]);

  const loadSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: settings, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', user.id)
        .single();

      if (error) throw error;

      if (settings) {
        setWorkingDays(settings.working_days);
        setWorkingHoursStart(settings.working_hours_start);
        setWorkingHoursEnd(settings.working_hours_end);
        setAppointmentInterval(settings.appointment_interval);
        setMaxSimultaneousAppointments(settings.max_simultaneous_appointments);
        setAdvanceBookingLimit(settings.advance_booking_limit);
        setMonthlyAppointmentsLimit(settings.monthly_appointments_limit || 4);
        setPhone(settings.phone || '');
      }

    } catch (error: any) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (workingDays.length === 0) {
      toast({
        title: "Dias de trabalho",
        description: "Selecione pelo menos um dia de funcionamento.",
        variant: "destructive",
      });
      return;
    }

    if (workingHoursStart >= workingHoursEnd) {
      toast({
        title: "Horários inválidos",
        description: "O horário de início deve ser menor que o de fim.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('company_settings')
        .update({
          working_days: workingDays,
          working_hours_start: workingHoursStart,
          working_hours_end: workingHoursEnd,
          appointment_interval: appointmentInterval,
          max_simultaneous_appointments: maxSimultaneousAppointments,
          advance_booking_limit: advanceBookingLimit,
          monthly_appointments_limit: monthlyAppointmentsLimit,
          phone: phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('company_id', user!.id);

      if (error) throw error;

      toast({
        title: "Configurações salvas!",
        description: "As configurações foram atualizadas com sucesso.",
      });

      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWorkingDayToggle = (dayId: number, checked: boolean) => {
    if (checked) {
      setWorkingDays([...workingDays, dayId]);
    } else {
      setWorkingDays(workingDays.filter(day => day !== dayId));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-whatsapp-green" />
            Configurações da Agenda
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Telefone da empresa */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-whatsapp-green" />
                Telefone da Empresa
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
              <p className="text-xs text-gray-500">
                Telefone para receber mensagens de confirmação de agendamentos
              </p>
            </div>

            <Separator />

            {/* Limite de agendamentos mensais */}
            <div className="space-y-2">
              <Label htmlFor="monthlyLimit" className="flex items-center gap-2">
                <Users className="w-4 h-4 text-whatsapp-green" />
                Limite de Agendamentos por Cliente (por mês)
              </Label>
              <Input
                id="monthlyLimit"
                type="number"
                min="1"
                max="50"
                value={monthlyAppointmentsLimit}
                onChange={(e) => setMonthlyAppointmentsLimit(Number(e.target.value))}
                required
              />
              <p className="text-xs text-gray-500">
                Quantos agendamentos cada cliente pode fazer por mês
              </p>
            </div>

            <Separator />

            {/* Dias de funcionamento */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-whatsapp-green" />
                Dias de Funcionamento
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {weekDays.map((day) => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.id}`}
                      checked={workingDays.includes(day.id)}
                      onCheckedChange={(checked) => handleWorkingDayToggle(day.id, checked as boolean)}
                    />
                    <Label htmlFor={`day-${day.id}`} className="text-sm">
                      {day.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Horários de funcionamento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workingHoursStart" className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-whatsapp-green" />
                  Horário de Início
                </Label>
                <Input
                  id="workingHoursStart"
                  type="time"
                  value={workingHoursStart}
                  onChange={(e) => setWorkingHoursStart(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workingHoursEnd">Horário de Fim</Label>
                <Input
                  id="workingHoursEnd"
                  type="time"
                  value={workingHoursEnd}
                  onChange={(e) => setWorkingHoursEnd(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Configurações de agendamento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appointmentInterval">Intervalo (minutos)</Label>
                <Input
                  id="appointmentInterval"
                  type="number"
                  min="15"
                  max="120"
                  step="15"
                  value={appointmentInterval}
                  onChange={(e) => setAppointmentInterval(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxSimultaneousAppointments">Máx. Simultâneos</Label>
                <Input
                  id="maxSimultaneousAppointments"
                  type="number"
                  min="1"
                  max="10"
                  value={maxSimultaneousAppointments}
                  onChange={(e) => setMaxSimultaneousAppointments(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="advanceBookingLimit">Limite Antecipação (dias)</Label>
                <Input
                  id="advanceBookingLimit"
                  type="number"
                  min="1"
                  max="365"
                  value={advanceBookingLimit}
                  onChange={(e) => setAdvanceBookingLimit(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* Ajuda */}
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
              <p className="font-medium mb-2">💡 Dicas:</p>
              <ul className="space-y-1 text-xs">
                <li>• Telefone: usado para receber confirmações via WhatsApp</li>
                <li>• Limite mensal: evita que clientes façam muitos agendamentos</li>
                <li>• Intervalo: tempo entre agendamentos consecutivos</li>
                <li>• Máx. Simultâneos: quantos clientes podem ser atendidos ao mesmo tempo</li>
                <li>• Limite Antecipação: quantos dias no futuro os clientes podem agendar</li>
              </ul>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-whatsapp-green hover:bg-green-600"
              >
                {submitting ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CompanySettingsModal;
