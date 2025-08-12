import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createAppointment } from '@/services/appointmentService';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const DoubleBookingTest = () => {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [testData, setTestData] = useState({
    companyId: '21a30258-691c-4d13-bdb6-ac9bb86398ee', // barbearia-vintage
    serviceId: 'eefea0c4-c3b0-4e97-8e2d-f7e0214e500d', // Barba
    date: '2025-01-09',
    time: '14:00'
  });

  const addResult = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    setResults(prev => [...prev, `${timestamp} ${emoji} ${message}`]);
  };

  const testDoubleBooking = async () => {
    if (!testData.companyId || !testData.serviceId) {
      toast({
        title: "Erro",
        description: "Preencha Company ID e Service ID",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    setResults([]);
    
    try {
      addResult('Iniciando teste de double-booking...', 'info');
      
      // Dados do primeiro agendamento
      const appointment1 = {
        company_id: testData.companyId,
        client_name: 'Cliente Teste 1',
        client_phone: '11999999001',
        client_email: 'teste1@email.com',
        service_id: testData.serviceId,
        appointment_date: testData.date,
        appointment_time: testData.time,
        status: 'confirmed' as const
      };

      // Dados do segundo agendamento (mesmo horário)
      const appointment2 = {
        company_id: testData.companyId,
        client_name: 'Cliente Teste 2',
        client_phone: '11999999002',
        client_email: 'teste2@email.com',
        service_id: testData.serviceId,
        appointment_date: testData.date,
        appointment_time: testData.time,
        status: 'confirmed' as const
      };

      // Tentar criar primeiro agendamento
      addResult('Criando primeiro agendamento...', 'info');
      const result1 = await createAppointment(appointment1);
      addResult(`Primeiro agendamento criado com sucesso! ID: ${result1.id}`, 'success');

      // Tentar criar segundo agendamento no mesmo horário
      addResult('Tentando criar segundo agendamento no mesmo horário...', 'info');
      
      try {
        const result2 = await createAppointment(appointment2);
        addResult(`❌ FALHA DE SEGURANÇA! Segundo agendamento foi criado: ${result2.id}`, 'error');
        
        toast({
          title: "⚠️ Problema de Segurança Detectado",
          description: "O sistema permitiu double-booking! Verifique a implementação.",
          variant: "destructive"
        });
      } catch (error: any) {
        if (error.message?.includes('não está mais disponível') || 
            error.message?.includes('idx_appointments_unique_slot') ||
            error.code === '23505') {
          addResult('✅ SUCESSO! Double-booking foi prevenido corretamente', 'success');
          addResult(`Erro esperado: ${error.message}`, 'info');
          
          toast({
            title: "✅ Teste Passou",
            description: "Sistema está prevenindo double-booking corretamente!",
          });
        } else {
          addResult(`Erro inesperado: ${error.message}`, 'error');
        }
      }

      // Limpar dados de teste
      addResult('Limpando dados de teste...', 'info');
      // Note: Em produção, você removeria os agendamentos de teste aqui
      
    } catch (error: any) {
      addResult(`Erro no teste: ${error.message}`, 'error');
      
      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Teste de Prevenção de Double-Booking
        </CardTitle>
        <p className="text-sm text-gray-600">
          Este teste verifica se o sistema está prevenindo agendamentos duplicados no mesmo horário.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Configuração do teste */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="companyId">Company ID</Label>
            <Input
              id="companyId"
              value={testData.companyId}
              onChange={(e) => setTestData(prev => ({ ...prev, companyId: e.target.value }))}
              placeholder="ID da empresa"
            />
          </div>
          <div>
            <Label htmlFor="serviceId">Service ID</Label>
            <Input
              id="serviceId"
              value={testData.serviceId}
              onChange={(e) => setTestData(prev => ({ ...prev, serviceId: e.target.value }))}
              placeholder="ID do serviço"
            />
          </div>
          <div>
            <Label htmlFor="date">Data do Teste</Label>
            <Input
              id="date"
              type="date"
              value={testData.date}
              onChange={(e) => setTestData(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="time">Horário do Teste</Label>
            <Input
              id="time"
              type="time"
              value={testData.time}
              onChange={(e) => setTestData(prev => ({ ...prev, time: e.target.value }))}
            />
          </div>
        </div>

        {/* Botão de teste */}
        <Button 
          onClick={testDoubleBooking} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Executando Teste...
            </>
          ) : (
            'Executar Teste de Double-Booking'
          )}
        </Button>

        {/* Resultados */}
        {results.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium mb-2">Resultados do Teste:</h3>
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informações sobre o teste */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Como funciona este teste:</h4>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Cria um agendamento para um horário específico</li>
            <li>2. Tenta criar outro agendamento no mesmo horário</li>
            <li>3. Verifica se o sistema previne o double-booking</li>
            <li>4. ✅ Sucesso = segundo agendamento é rejeitado</li>
            <li>5. ❌ Falha = segundo agendamento é aceito (problema de segurança)</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoubleBookingTest;