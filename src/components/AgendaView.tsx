
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Phone, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AgendaView = () => {
  const [currentWeek, setCurrentWeek] = useState(0);
  
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(addDays(today, currentWeek * 7), { weekStartsOn: 0 });
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    return addDays(startOfCurrentWeek, i);
  });

  // Dados mockados de agendamentos
  const appointments = [
    { id: 1, date: format(today, 'yyyy-MM-dd'), time: '09:00', client: 'Maria Silva', service: 'Corte Feminino', phone: '(11) 99999-1111', status: 'confirmado' },
    { id: 2, date: format(today, 'yyyy-MM-dd'), time: '10:30', client: 'João Santos', service: 'Corte Masculino', phone: '(11) 99999-2222', status: 'confirmado' },
    { id: 3, date: format(addDays(today, 1), 'yyyy-MM-dd'), time: '14:00', client: 'Ana Costa', service: 'Escova', phone: '(11) 99999-3333', status: 'pendente' },
    { id: 4, date: format(addDays(today, 2), 'yyyy-MM-dd'), time: '15:30', client: 'Pedro Lima', service: 'Coloração', phone: '(11) 99999-4444', status: 'confirmado' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(apt => apt.date === dateStr);
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(currentWeek - 1);
  };

  const goToNextWeek = () => {
    setCurrentWeek(currentWeek + 1);
  };

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Agenda Semanal</h2>
          <p className="text-gray-600">Gerencie seus agendamentos da semana</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center min-w-[120px]">
            <p className="font-medium text-gray-800">
              {format(startOfCurrentWeek, 'MMMM yyyy', { locale: ptBR })}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Weekly Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {weekDays.map((date, index) => {
          const dayAppointments = getAppointmentsForDate(date);
          const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
          
          return (
            <Card key={index} className={`${isToday ? 'border-primary border-2' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-center text-sm ${isToday ? 'text-primary' : 'text-gray-600'}`}>
                  <div>{format(date, 'EEE', { locale: ptBR })}</div>
                  <div className="text-lg font-bold">{format(date, 'd')}</div>
                  {isToday && <div className="text-xs text-primary">Hoje</div>}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {dayAppointments.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Sem agendamentos</p>
                  ) : (
                    dayAppointments.map((appointment) => (
                      <div key={appointment.id} className="bg-gray-50 p-2 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-primary">{appointment.time}</span>
                          <Badge className={`${getStatusColor(appointment.status)} text-xs`}>
                            {appointment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-500" />
                          <span className="font-medium">{appointment.client}</span>
                        </div>
                        <div className="text-gray-600">{appointment.service}</div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-500">{appointment.phone}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Resumo da Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{appointments.filter(a => a.status === 'confirmado').length}</p>
              <p className="text-sm text-green-700">Confirmados</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{appointments.filter(a => a.status === 'pendente').length}</p>
              <p className="text-sm text-yellow-700">Pendentes</p>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <p className="text-2xl font-bold text-primary">{appointments.length}</p>
              <p className="text-sm text-primary">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgendaView;
