import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { 
  getNowInBrazil, 
  getTodayInBrazil, 
  getCurrentTimeInBrazil,
  formatUtcToBrazilTime,
  debugTimezone 
} from '@/utils/timezone';

const TimezoneDebug = () => {
  const [currentTime, setCurrentTime] = useState({
    utc: new Date(),
    brazil: getNowInBrazil(),
    utcString: new Date().toISOString(),
    brazilString: '',
    todayBrazil: getTodayInBrazil(),
    currentTimeBrazil: getCurrentTimeInBrazil()
  });

  const updateTimes = () => {
    const now = new Date();
    const brazilNow = getNowInBrazil();
    
    setCurrentTime({
      utc: now,
      brazil: brazilNow,
      utcString: now.toISOString(),
      brazilString: formatUtcToBrazilTime(now),
      todayBrazil: getTodayInBrazil(),
      currentTimeBrazil: getCurrentTimeInBrazil()
    });

    // Debug no console
    debugTimezone();
  };

  useEffect(() => {
    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  const timeDifference = Math.abs(currentTime.utc.getTime() - currentTime.brazil.getTime()) / (1000 * 60 * 60);
  const isCorrectDifference = timeDifference >= 2 && timeDifference <= 4; // UTC-3 ou UTC-2 (horário de verão)

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Debug - Fuso Horário Brasil
          <Button
            variant="outline"
            size="sm"
            onClick={updateTimes}
            className="ml-auto"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Atualizar
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Geral */}
        <div className="flex items-center gap-2">
          {isCorrectDifference ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Timezone Correto
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              Problema no Timezone
            </Badge>
          )}
          <span className="text-sm text-gray-600">
            Diferença: {timeDifference.toFixed(1)}h
          </span>
        </div>

        {/* Comparação de Horários */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-800 mb-2">UTC (Banco de Dados)</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Data/Hora:</strong> {currentTime.utcString}</p>
                <p><strong>Formatado:</strong> {currentTime.utc.toLocaleString('pt-BR')}</p>
                <p><strong>Timestamp:</strong> {currentTime.utc.getTime()}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-green-800 mb-2">Brasil (Aplicação)</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Data/Hora:</strong> {currentTime.brazilString}</p>
                <p><strong>Data Hoje:</strong> {currentTime.todayBrazil}</p>
                <p><strong>Hora Atual:</strong> {currentTime.currentTimeBrazil}</p>
                <p><strong>Timestamp:</strong> {currentTime.brazil.getTime()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Testes de Funcionalidade */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Testes de Validação</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Diferença de fuso horário:</span>
                <Badge variant={isCorrectDifference ? "default" : "destructive"}>
                  {isCorrectDifference ? "✅ OK" : "❌ Erro"}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span>Data atual Brasil:</span>
                <Badge variant="outline">
                  {currentTime.todayBrazil}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span>Hora atual Brasil:</span>
                <Badge variant="outline">
                  {currentTime.currentTimeBrazil}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Como Validar</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• A diferença deve ser de 2-4 horas (dependendo do horário de verão)</li>
              <li>• A data/hora do Brasil deve corresponder ao seu horário local</li>
              <li>• Agendamentos devem usar o horário do Brasil</li>
              <li>• O banco de dados mantém UTC para consistência</li>
            </ul>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default TimezoneDebug;