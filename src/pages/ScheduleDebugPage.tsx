import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { debugAvailableTimes } from '@/utils/debugAvailableTimes';
import { checkAvailableTimes } from '@/services/publicBookingService';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, Bug, Play } from 'lucide-react';

const ScheduleDebugPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState('');
  const [debugResult, setDebugResult] = useState<any>(null);
  const [publicResult, setPublicResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDebugTest = async () => {
    if (!user || !selectedDate) {
      toast({
        title: "Erro",
        description: "Faça login e selecione uma data para testar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Starting debug test...');
      
      // Get company settings first
      const { data: companySettings } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', user.id)
        .single();
      
      // Test debug function
      const debugRes = await debugAvailableTimes(user.id, selectedDate, companySettings);
      setDebugResult(debugRes);
      
      // Test public function
      const publicRes = await checkAvailableTimes(user.id, selectedDate, 60);
      setPublicResult({ availableTimes: publicRes });
      
      toast({
        title: "Teste concluído",
        description: "Verifique os resultados abaixo.",
      });
      
    } catch (error) {
      console.error('❌ Debug test failed:', error);
      toast({
        title: "Erro no teste",
        description: "Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">Faça login para acessar o debug.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bug className="w-6 h-6 text-red-600" />
            Debug - Sistema de Horários
          </h1>
          <p className="text-gray-600">Teste e debug do sistema de horários por dia da semana</p>
        </div>
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
            </div>
            <div className="flex items-end">
              <Button 
                onClick={runDebugTest}
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
                    <Bug className="w-4 h-4 mr-2" />
                    Executar Debug
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Results */}
      {debugResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Resultado do Debug Detalhado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
              {JSON.stringify(debugResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Public Function Results */}
      {publicResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              Resultado da Função Pública
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Horários Disponíveis:</h4>
                {publicResult.availableTimes.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {publicResult.availableTimes.map((time: string) => (
                      <div key={time} className="bg-green-100 text-green-800 px-3 py-2 rounded text-center">
                        {time}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-red-100 text-red-800 px-4 py-3 rounded">
                    Nenhum horário disponível
                  </div>
                )}
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <pre className="text-sm">
                  {JSON.stringify(publicResult, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Como usar este debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600">
            <h4 className="font-semibold mb-2">Passos para debug:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Configure os horários na aba "Horários" das configurações</li>
              <li>Selecione uma data para teste</li>
              <li>Execute o debug para ver os detalhes</li>
              <li>Compare os resultados entre debug detalhado e função pública</li>
              <li>Verifique o console do navegador para logs detalhados</li>
            </ol>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <h4 className="font-semibold text-yellow-800 mb-1">Dicas:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Abra o console do navegador (F12) para ver logs detalhados</li>
              <li>• Teste diferentes dias da semana</li>
              <li>• Verifique se há configurações de horário para o dia selecionado</li>
              <li>• Confirme se o dia está marcado como "ativo"</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleDebugPage;