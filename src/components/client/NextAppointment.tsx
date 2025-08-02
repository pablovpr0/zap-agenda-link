import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, MapPin, Phone, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NextAppointmentProps {
  clientPhone: string;
  companyId: string;
  companyData: any;
  onBack: () => void;
}

interface NextAppointmentData {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes?: string;
  service: {
    name: string;
    duration: number;
    price?: number;
  };
}

const NextAppointment = ({ clientPhone, companyId, companyData, onBack }: NextAppointmentProps) => {
  const [appointment, setAppointment] = useState<NextAppointmentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNextAppointment();
  }, [clientPhone, companyId]);

  const fetchNextAppointment = async () => {
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
        setAppointment(null);
        return;
      }

      // Buscar próximo agendamento do cliente
      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

      const { data: appointmentData, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          notes,
          service:services (
            name,
            duration,
            price
          )
        `)
        .eq('client_id', client.id)
        .eq('company_id', companyId)
        .in('status', ['confirmed', 'pending'])
        .or(`appointment_date.gt.${today},and(appointment_date.eq.${today},appointment_time.gte.${currentTime})`)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar próximo agendamento:', error);
        return;
      }

      setAppointment(appointmentData || null);
    } catch (error) {
      console.error('Erro ao carregar próximo agendamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatPrice = (price?: number) => {
    if (!price) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#19c662]"></div>
            <span className="ml-3 text-gray-600">Carregando agendamento...</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Próximo Agendamento</h1>
        </div>

        {/* Próximo agendamento */}
        {!appointment ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum agendamento próximo</h3>
              <p className="text-gray-600">Você não possui agendamentos futuros nesta empresa.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Card do agendamento */}
            <Card className="border-l-4 border-l-[#19c662]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-[#19c662]">
                    {appointment.service.name}
                  </CardTitle>
                  <Badge variant="default" className="bg-[#19c662] hover:bg-[#19c662]">
                    {appointment.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center text-gray-700">
                    <Calendar className="h-5 w-5 mr-3 text-[#19c662]" />
                    <div>
                      <div className="font-medium">Data</div>
                      <div className="text-sm text-gray-600">{formatDate(appointment.appointment_date)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <Clock className="h-5 w-5 mr-3 text-[#19c662]" />
                    <div>
                      <div className="font-medium">Horário</div>
                      <div className="text-sm text-gray-600">{appointment.appointment_time} • {appointment.service.duration} min</div>
                    </div>
                  </div>
                </div>

                {appointment.service.price && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-sm font-medium text-green-800">Valor do Serviço</div>
                    <div className="text-lg font-bold text-green-900">{formatPrice(appointment.service.price)}</div>
                  </div>
                )}

                {appointment.notes && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-1">Observações</div>
                    <div className="text-sm text-gray-600">{appointment.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card da empresa */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações da Empresa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <User className="h-4 w-4 mr-3 text-gray-500" />
                  <span className="font-medium">{companyData.company_name}</span>
                </div>
                
                {companyData.address && (
                  <div className="flex items-center text-gray-700">
                    <MapPin className="h-4 w-4 mr-3 text-gray-500" />
                    <span className="text-sm">{companyData.address}</span>
                  </div>
                )}
                
                {companyData.phone && (
                  <div className="flex items-center text-gray-700">
                    <Phone className="h-4 w-4 mr-3 text-gray-500" />
                    <span className="text-sm">{companyData.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default NextAppointment;