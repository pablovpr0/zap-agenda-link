
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMonthlyAppointments } from '@/hooks/useMonthlyAppointments';
import CalendarHeader from './monthly-agenda/CalendarHeader';
import CalendarGrid from './monthly-agenda/CalendarGrid';
import AppointmentDialog from './monthly-agenda/AppointmentDialog';
import BackButton from './BackButton';
import { useToast } from '@/hooks/use-toast';
import { getNowInBrazil } from '@/utils/timezone';

interface MonthlyAgendaProps {
  onBack?: () => void;
}

interface MonthlyAppointment {
  id: string;
  appointment_time: string;
  appointment_date: string;
  status: string;
  duration: number;
  notes?: string;
  client_name: string;
  client_phone: string;
  service_name: string;
}

const MonthlyAgenda = ({ onBack }: MonthlyAgendaProps) => {
  const { toast } = useToast();
  // Usar horário de Brasília para data atual
  const [currentDate, setCurrentDate] = useState(() => {
    return getNowInBrazil();
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const { appointments, loading, getAppointmentsForDate, refreshAppointments } = useMonthlyAppointments(currentDate);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const goToPreviousMonth = () => {
    setCurrentDate(addMonths(currentDate, -1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(getNowInBrazil());
  };

  const handleDateClick = (date: Date) => {
    const dayAppointments = getAppointmentsForDate(date);
    if (dayAppointments.length > 0) {
      console.log('Selecionando data:', format(date, 'yyyy-MM-dd'), 'com', dayAppointments.length, 'agendamentos');
      setSelectedDate(date);
    } else {
      // Mensagem quando não há agendamentos
      toast({
        title: "Nenhum agendamento",
        description: `Não há agendamentos para ${format(date, "dd 'de' MMMM", { locale: ptBR })}.`,
      });
    }
  };

  const handleWhatsAppClick = (phone: string, clientName: string, appointmentDate?: string, appointmentTime?: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Mensagem de lembrete personalizada com data correta em português
    let message = `Olá, ${clientName}! 👋\n\n`;
    message += `🔔 *LEMBRETE DO SEU AGENDAMENTO*\n\n`;
    
    if (appointmentDate && appointmentTime) {
      // Garantir que a data seja formatada corretamente em português brasileiro
      const appointmentDateObj = new Date(appointmentDate + 'T00:00:00');
      const formattedDate = format(appointmentDateObj, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      const formattedTime = appointmentTime.substring(0, 5);
      message += `📅 *Data:* ${formattedDate}\n`;
      message += `⏰ *Horário:* ${formattedTime}\n\n`;
    }
    
    message += `Estamos ansiosos para atendê-lo(a)! ✨\n\n`;
    message += `Se precisar remarcar ou tiver alguma dúvida, estou à disposição para ajudar! 😊`;
    
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCancelAppointment = (phone: string, clientName: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = `Olá, ${clientName}! 😔\n\n` +
      `Seu agendamento foi *CANCELADO* conforme solicitado.\n\n` +
      `Se desejar reagendar, estaremos à disposição para encontrar um novo horário que seja conveniente para você! 😊\n\n` +
      `Obrigado pela compreensão! 🙏`;
    
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Mensagem de cancelamento",
      description: "Mensagem de cancelamento enviada para o cliente.",
    });
  };

  const handleRescheduleAppointment = (phone: string, clientName: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = `Olá, ${clientName}! 📅\n\n` +
      `Precisamos *REAGENDAR* seu horário.\n\n` +
      `Por favor, entre em contato conosco para escolhermos uma nova data e horário que seja conveniente para você! 😊\n\n` +
      `Estamos à disposição para encontrar a melhor solução! ✨`;
    
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Mensagem de reagendamento",
      description: "Mensagem de reagendamento enviada para o cliente.",
    });
  };

  const handleDeleteAppointment = () => {
    toast({
      title: "Agendamento excluído",
      description: "O agendamento foi removido permanentemente do sistema.",
    });
  };

  // Transformar appointments para o formato esperado pelo AppointmentDialog
  const transformAppointments = (rawAppointments: any[]): MonthlyAppointment[] => {
    return rawAppointments.map(apt => ({
      id: apt.id,
      appointment_time: apt.appointment_time,
      appointment_date: apt.appointment_date,
      status: apt.status,
      duration: 60,
      notes: apt.notes,
      client_name: apt.client_name,
      client_phone: apt.client_phone,
      service_name: apt.service_name
    }));
  };

  const selectedDateAppointments = selectedDate ? transformAppointments(getAppointmentsForDate(selectedDate)) : [];

  // Transform appointments for CalendarGrid - convert to the expected format
  const transformedAppointments = Object.keys(appointments).reduce((acc, dateKey) => {
    acc[dateKey] = appointments[dateKey].map(apt => ({
      id: apt.id,
      appointment_time: apt.appointment_time,
      appointment_date: apt.appointment_date,
      client_name: apt.client_name,
      service_name: apt.service_name,
      professional_name: apt.professional_name,
      status: apt.status,
      duration: apt.duration || 60,
      client_phone: apt.client_phone || ''
    }));
    return acc;
  }, {} as Record<string, any[]>);

  const handleAppointmentClick = (appointment: any) => {
    // Convert the date string to a Date object for setSelectedDate
    const appointmentDate = new Date(appointment.date + 'T00:00:00');
    setSelectedDate(appointmentDate);
  };

  const handleCalendarDateClick = (dateKey: string) => {
    const date = new Date(dateKey + 'T00:00:00');
    handleDateClick(date);
  };

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 fade-in">
      {onBack && (
        <BackButton onClick={onBack} />
      )}
      
      <CalendarHeader
        currentDate={currentDate}
        onPreviousMonth={goToPreviousMonth}
        onNextMonth={goToNextMonth}
        onToday={goToToday}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Calendar className="w-4 md:w-5 h-4 md:h-5 text-primary" />
            Agenda - {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-6 pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Carregando agendamentos...</div>
            </div>
          ) : (
            <CalendarGrid
              currentDate={currentDate}
              appointments={transformedAppointments}
              onAppointmentClick={handleAppointmentClick}
              onDateClick={handleCalendarDateClick}
            />
          )}
        </CardContent>
      </Card>

      <AppointmentDialog
        selectedDate={selectedDate}
        appointments={selectedDateAppointments}
        onClose={() => setSelectedDate(null)}
        onWhatsAppClick={handleWhatsAppClick}
        onCancelClick={handleCancelAppointment}
        onRescheduleClick={handleRescheduleAppointment}
        onDeleteClick={handleDeleteAppointment}
        onRefresh={refreshAppointments}
      />
    </div>
  );
};

export default MonthlyAgenda;
