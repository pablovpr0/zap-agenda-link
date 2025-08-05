import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import TimezoneDebug from '@/components/debug/TimezoneDebug';
import { createAppointment } from '@/services/appointmentService';
import { generateAvailableTimeSlots } from '@/utils/timeSlots';
import { getTodayInBrazil, getCurrentTimeInBrazil } from '@/utils/timezone';

const TimezoneTest = () => {
  const { toast } = useToast();
  const [testDate, setTestDate] = useState(getTodayInBrazil());
  const [testTime, setTestTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const generateTestTimes = () => {
    const config = {
      workingHoursStart: '09:00',
      workingHoursEnd: '18:00',
      appointmentInterval: 30,
      lunchBreakEnabled: true,
      lunchStartTime: '12:00',
      lunchEndTime: '13:00',
      serviceDuration: 60
    };

    const times = generateAvailableTimeSlots(testDate, config, []);
    setAvailableTimes(times);
    
    toast({
      title: "Horários gerados",
      description: `${times.length} horários disponíveis para ${testDate}`
    });
  };

  const testAppointmentCreation = async () => {
    if (!testTime) {
      toast({
        title: "Erro",
        description: "Selecione um horário para teste",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const testAppointment = await createAppointment({
        company_id: 'test-company-id',
        client_name: 'Teste Timezone',
        client_phone: '(11) 99999-9999',
        client_email: 'teste@timezone.com',
        service_id: 'test-service-id',
        appointment_date: testDate,
        appointment_time: testTime,
        notes: `Teste de timezone - Criado em ${getCurrentTimeInBrazil()}`
      });

      toast({
        title: "Agendamento teste criado!",
        description: `ID: ${testAppointment.id} - Horário: ${testTime}`,
      });

    } catch (error: any) {
      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Teste de Fuso Horário</h1>
        <p className="text-gray-600">Validação do sistema de timezone para o Brasil</p>
      </div>

      {/* Debug Component */}
      <TimezoneDebug />

      {/* Teste de Geração de Horários */}
      <Card>
        <CardHeader>
          <CardTitle>Teste de Geração de Horários</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="test-date">Data para Teste</Label>
              <Input
                id="test-date"
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={generateTestTimes} className="w-full">
                Gerar Horários Disponíveis
              </Button>
            </div>
          </div>

          {availableTimes.length > 0 && (
            <div>
              <Label>Horários Disponíveis ({availableTimes.length})</Label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-2">
                {availableTimes.map((time) => (
                  <Button
                    key={time}
                    variant={testTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTestTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teste de Criação de Agendamento */}
      <Card>
        <CardHeader>
          <CardTitle>Teste de Criação de Agendamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Atenção:</strong> Este teste criará um agendamento real no banco de dados.
              Use apenas em ambiente de desenvolvimento.
            </p>
          </div>

          {testTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Dados do Teste:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li><strong>Data:</strong> {testDate}</li>
                <li><strong>Horário:</strong> {testTime}</li>
                <li><strong>Cliente:</strong> Teste Timezone</li>
                <li><strong>Telefone:</strong> (11) 99999-9999</li>
              </ul>
            </div>
          )}

          <Button
            onClick={testAppointmentCreation}
            disabled={!testTime || loading}
            className="w-full"
          >
            {loading ? 'Criando Teste...' : 'Criar Agendamento Teste'}
          </Button>
        </CardContent>
      </Card>

      {/* Instruções de Validação */}
      <Card>
        <CardHeader>
          <CardTitle>Critérios de Validação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✅</span>
              <span>O horário exibido deve corresponder ao horário de Brasília</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✅</span>
              <span>Agendamentos para "hoje" devem filtrar horários já passados</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✅</span>
              <span>Horários salvos no banco devem manter consistência</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✅</span>
              <span>Sistema deve funcionar independente de horário de verão</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimezoneTest;