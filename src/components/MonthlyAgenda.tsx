
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Phone } from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  client_name: string;
  client_phone: string;
  service_name: string;
  status: string;
}

const MonthlyAgenda = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user, currentDate]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      
      const { data: appointmentData, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          clients!inner(name, phone),
          services!inner(name)
        `)
        .eq('company_id', user!.id)
        .gte('appointment_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('appointment_date', format(monthEnd, 'yyyy-MM-dd'))
        .order('appointment_date')
        .order('appointment_time');

      if (error) throw error;

      // Processar dados dos agendamentos
      const processedAppointments = appointmentData?.map(apt => ({
        id: apt.id,
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        client_name: apt.clients.name,
        client_phone: apt.clients.phone,
        service_name: apt.services.name,
        status: apt.status
      })) || [];

      setAppointments(processedAppointments);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(apt => apt.appointment_date === dateStr);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(addMonths(currentDate, -1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (date: Date) => {
    const dayAppointments = getAppointmentsForDate(date);
    if (dayAppointments.length > 0) {
      setSelectedDate(date);
    }
  };

  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  // Criar array de dias começando no domingo
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
  
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-800">Agenda Mensal</h2>
          <p className="text-gray-600 text-sm">Gerencie seus agendamentos do mês</p>
        </div>
        
        <div className="flex items-center justify-center md:justify-end gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center min-w-[120px] md:min-w-[140px]">
            <p className="font-medium text-gray-800 text-sm md:text-base">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Calendar className="w-4 md:w-5 h-4 md:h-5 text-primary" />
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Carregando agendamentos...</div>
            </div>
          ) : (
            <>
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <div key={day} className="p-1 md:p-2 text-center text-xs md:text-sm font-medium text-gray-600">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  const dayAppointments = getAppointmentsForDate(date);
                  const isCurrentMonth = isSameMonth(date, currentDate);
                  const isTodayDate = isToday(date);
                  const hasAppointments = dayAppointments.length > 0;
                  
                  return (
                    <div
                      key={index}
                      className={`
                        p-1 md:p-2 min-h-[40px] md:min-h-[60px] border rounded-lg cursor-pointer transition-colors text-center
                        ${isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                        ${isTodayDate ? 'border-primary border-2 bg-primary/5' : 'border-gray-200'}
                        ${hasAppointments ? 'hover:bg-blue-50' : 'hover:bg-gray-100'}
                      `}
                      onClick={() => handleDateClick(date)}
                    >
                      <div className="text-xs md:text-sm font-medium">
                        {format(date, 'd')}
                      </div>
                      {hasAppointments && (
                        <div className="mt-1">
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full mx-auto"></div>
                          <div className="text-[10px] md:text-xs text-primary mt-1">
                            {dayAppointments.length}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog para mostrar agendamentos do dia */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-md mx-3">
          {selectedDate && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base md:text-lg">
                  Agendamentos - {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {selectedDateAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{appointment.client_name}</p>
                      <p className="text-sm text-gray-600">{appointment.appointment_time}</p>
                      <p className="text-sm text-gray-500">{appointment.service_name}</p>
                      <p className="text-xs text-gray-400 capitalize">{appointment.status}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-xs md:text-sm text-gray-600 hidden md:inline">{appointment.client_phone}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`tel:${appointment.client_phone}`)}
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MonthlyAgenda;
