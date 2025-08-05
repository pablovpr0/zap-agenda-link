import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { checkAvailableTimes } from '@/services/publicBookingService';
import { Clock, Play, Calendar } from 'lucide-react';

const QuickScheduleTest = () => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Usar empresa Pablo que tem dados configurados
  const PABLO_COMPANY_ID = '21a30258-691c-4d13-bdb6-ac9bb86398ee';

  const testSchedule = async () => {
    if (!selectedDate) {
      toast({
        title: "Erro",
        description: "Selecione uma data para testar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Testando horários para Pablo...');
      console.log('📅 Data:', selectedDate);
      console.log('🏢 Company ID:', PABLO_COMPANY_ID);
      
      const times = await checkAvailableTimes(PABLO_COMPANY_ID, selectedDate, 60);
      
      setResult({
        date: selectedDate,
        companyId: PABLO_COMPANY_ID,
        availableTimes: times,
        count: times.length
      });
      
      toast({
        title: "Teste concluído",
        description: `Encontrados ${times.length} horários disponíveis.`,
      });
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      toast({
        title: "Erro no teste",
        description: "Verifique o console para detalhes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[date.getDay()];
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Clock className="w-6 h-6 text-blue-600" />
          Teste Rápido - Horários Pablo
        </h1>
        <p className="text-gray-600">Teste direto da função checkAvailableTimes</p>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-green-600" />
            Executar Teste
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="test-date">Data para Teste</Label>
              <Input
                id="test-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              {selectedDate && (
                <p className="text-sm text-gray-500 mt-1">
                  {getDayName(selectedDate)} - {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
            <div className="flex items-end">
              <Button 
                onClick={testSchedule}
                disabled={loading || !selectedDate}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Testando...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Testar Horários
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-800">
              <strong>Empresa de teste:</strong> Pablo (pablo)<br/>
              <strong>Horários configurados:</strong> Segunda a Sexta: 09:00-18:00<br/>
              <strong>Sábado e Domingo:</strong> Fechado
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Resultado do Teste
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Data:</strong> {result.date}
                </div>
                <div>
                  <strong>Dia da semana:</strong> {getDayName(result.date)}
                </div>
                <div>
                  <strong>Company ID:</strong> {result.companyId}
                </div>
                <div>
                  <strong>Horários encontrados:</strong> {result.count}
                </div>
              </div>
              
              {result.availableTimes.length > 0 ? (
                <div>
                  <h4 className="font-semibold mb-2">Horários Disponíveis:</h4>
                  <div className="grid grid-cols-6 gap-2">
                    {result.availableTimes.map((time: string) => (
                      <div key={time} className="bg-green-100 text-green-800 px-3 py-2 rounded text-center text-sm">
                        {time}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-red-100 text-red-800 px-4 py-3 rounded">
                  <strong>Nenhum horário disponível</strong>
                  <p className="text-sm mt-1">
                    Possíveis causas:
                    <br/>• Dia está fechado (Sábado/Domingo)
                    <br/>• Não há configuração para este dia
                    <br/>• Todos os horários estão ocupados
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Como interpretar os resultados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600">
            <h4 className="font-semibold mb-2">Cenários esperados:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Segunda a Sexta:</strong> Deve mostrar horários de 09:00 às 18:00 (intervalos de 30min)</li>
              <li><strong>Sábado e Domingo:</strong> Deve mostrar "Nenhum horário disponível" (dias fechados)</li>
              <li><strong>Datas passadas:</strong> Não devem aparecer horários</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <h4 className="font-semibold text-yellow-800 mb-1">Dicas de debug:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Abra o console do navegador (F12) para ver logs detalhados</li>
              <li>• Teste diferentes dias da semana</li>
              <li>• Se não aparecem horários em dias úteis, há problema na função</li>
              <li>• Se aparecem horários em fins de semana, há problema na configuração</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickScheduleTest;