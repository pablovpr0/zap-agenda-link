import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Clock, Calendar, Phone, Users, Coffee, Link, CheckCircle, AlertCircle } from 'lucide-react';
import { validateSlug, isSlugTaken } from '@/services/companySettingsService';

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
  const [slug, setSlug] = useState('');
  const [originalSlug, setOriginalSlug] = useState('');
  
  // Lunch break settings
  const [lunchBreakEnabled, setLunchBreakEnabled] = useState(false);
  const [lunchStartTime, setLunchStartTime] = useState('12:00');
  const [lunchEndTime, setLunchEndTime] = useState('13:00');

  // Slug validation
  const [slugValidation, setSlugValidation] = useState<{ isValid: boolean; error?: string }>({ isValid: true });
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);

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

  // Validação de slug em tempo real
  useEffect(() => {
    const checkSlug = async () => {
      if (slug === originalSlug) {
        setSlugValidation({ isValid: true });
        setIsSlugAvailable(true);
        return;
      }

      const validation = validateSlug(slug);
      setSlugValidation(validation);

      if (validation.isValid) {
        try {
          const taken = await isSlugTaken(slug);
          setIsSlugAvailable(!taken);
        } catch (error) {
          setIsSlugAvailable(null);
        }
      } else {
        setIsSlugAvailable(null);
      }
    };

    if (slug) {
      const timer = setTimeout(checkSlug, 500);
      return () => clearTimeout(timer);
    }
  }, [slug, originalSlug]);

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
        setSlug(settings.slug || '');
        setOriginalSlug(settings.slug || '');
        setLunchBreakEnabled(settings.lunch_break_enabled || false);
        setLunchStartTime(settings.lunch_start_time || '12:00');
        setLunchEndTime(settings.lunch_end_time || '13:00');
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

  const handleSlugChange = (value: string) => {
    const cleanSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-');
    setSlug(cleanSlug);
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

    if (lunchBreakEnabled && lunchStartTime >= lunchEndTime) {
      toast({
        title: "Horários de almoço inválidos",
        description: "O horário de início do almoço deve ser menor que o de fim.",
        variant: "destructive",
      });
      return;
    }

    if (!slugValidation.isValid || isSlugAvailable === false) {
      toast({
        title: "Slug inválido",
        description: slugValidation.error || "Este slug já está sendo usado.",
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
          slug: slug,
          lunch_break_enabled: lunchBreakEnabled,
          lunch_start_time: lunchBreakEnabled ? lunchStartTime : null,
          lunch_end_time: lunchBreakEnabled ? lunchEndTime : null,
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

  const getSlugStatusIcon = () => {
    if (!slugValidation.isValid) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (isSlugAvailable === false) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (isSlugAvailable === true) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return null;
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

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

            {/* Link personalizado */}
            <div className="space-y-2">
              <Label htmlFor="slug" className="flex items-center gap-2">
                <Link className="w-4 h-4 text-whatsapp-green" />
                Link Personalizado
              </Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-600 text-sm">
                  {baseUrl}/public/
                </span>
                <div className="relative flex-1">
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="rounded-l-none"
                    placeholder="minha-empresa"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getSlugStatusIcon()}
                  </div>
                </div>
              </div>
              {!slugValidation.isValid && (
                <p className="text-xs text-red-600">{slugValidation.error}</p>
              )}
              {isSlugAvailable === false && (
                <p className="text-xs text-red-600">Este slug já está sendo usado</p>
              )}
              <p className="text-xs text-gray-500">
                URL personalizada para sua página de agendamentos
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

            <Separator />

            {/* Configuração de horário de almoço */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-whatsapp-green" />
                  Horário de Almoço
                </Label>
                <Switch
                  checked={lunchBreakEnabled}
                  onCheckedChange={setLunchBreakEnabled}
                />
              </div>
              
              {lunchBreakEnabled && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="lunchStartTime">Início do Almoço</Label>
                    <Input
                      id="lunchStartTime"
                      type="time"
                      value={lunchStartTime}
                      onChange={(e) => setLunchStartTime(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lunchEndTime">Fim do Almoço</Label>
                    <Input
                      id="lunchEndTime"
                      type="time"
                      value={lunchEndTime}
                      onChange={(e) => setLunchEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

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
                <li>• Link personalizado: torne sua URL mais profissional</li>
                <li>• Limite mensal: evita que clientes façam muitos agendamentos</li>
                <li>• Horário de almoço: período em que não haverá agendamentos disponíveis</li>
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
