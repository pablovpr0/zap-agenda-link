import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, User, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientHistoryProps {
  clientPhone: string;
  companyId: string;
  onBack: () => void;
}

interface AppointmentHistory {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes?: string;
  service: {
    name: string;
    duration: number;
  };
}

const ClientHistory = ({ clientPhone, companyId, onBack }: ClientHistoryProps) => {
  const [appointments, setAppointments] = useState<AppointmentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointmentHistory();
  }, [clientPhone, companyId]);

  const fetchAppointmentHistory = async () => {
    try {
      setLoading(true);

      // Buscar cliente pelo telefone
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', clientPhone)
        .eq('company_id', companyId)
        .single();

      if (!client) {
        setAppointments([]);
        return;
      }

      // Buscar agendamentos do cliente
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          notes,
          service:services (
            name,
            duration
          )
        `)
        .eq('client_id', client.id)
        .eq('company_id', companyId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) {
        console.error('Erro ao buscar histórico:', error);
        return;
      }

      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { label: 'Confirmado', variant: 'default' as const },
      completed: { label: 'Concluído', variant: 'secondary' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const },
      pending: { label: 'Pendente', variant: 'outline' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#19c662]"></div>
            <span className="ml-3 text-gray-600">Carregando histórico...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="mr-3 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Agendamentos</h1>
        </div>

        {/* Lista de agendamentos */}
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum agendamento encontrado</h3>
              <p className="text-gray-600">Você ainda não possui agendamentos nesta empresa.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{appointment.service.name}</CardTitle>
                    {getStatusBadge(appointment.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(appointment.appointment_date)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{appointment.appointment_time} • {appointment.service.duration} minutos</span>
                  </div>
                  {appointment.notes && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      <strong>Observações:</strong> {appointment.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientHistory;