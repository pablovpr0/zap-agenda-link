import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { usePublicBooking } from '@/hooks/usePublicBooking';
import { Calendar, Clock, User } from 'lucide-react';

const PublicBookingTest = () => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  // Usar empresa Pablo para teste
  const PABLO_SLUG = 'pablo';
  
  const {
    companyData,
    companySettings,
    services,
    loading,
    error,
    generateAvailableTimes
  } = usePublicBooking(PABLO_SLUG);

  const loadTimesForDate = async () => {
    if (!selectedDate || !generateAvailableTimes) return;

    setLoadingTimes(true);
    try {
      console.log('🔄 Carregando horários via usePublicBooking...');
      console.log('📊 Company settings:', companySettings);
      
      const times = await generateAvailableTimes(selectedDate, 60);
      setAvailableTimes(times);
      
      console.log('✅ Horários carregados:', times);
      
      toast({
        title: "Horários carregados",
        description: `${times.length} horários disponíveis encontrados.`,
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar horários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os horários.",
        variant: "destructive",
      });
    } finally {
      setLoadingTimes(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      loadTimesForDate();
    } else {
      setAvailableTimes([]);
    }
  }, [selectedDate, generateAvailableTimes]);

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[date.getDay()];
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Carregando dados da empresa...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="font-semibold">Erro ao carregar empresa</p>
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <User className="w-6 h-6 text-green-600" />
          Teste Área Pública - {companyData?.company_name || 'Pablo'}
        </h1>
        <p className="text-gray-600">Simulação da área pública de agendamento</p>
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Nome:</strong> {companyData?.company_name}</div>
            <div><strong>Slug:</strong> {companyData?.slug}</div>
            <div><strong>Status:</strong> {companyData?.status_aberto ? 'Aberto' : 'Fechado'}</div>
            <div><strong>Serviços:</strong> {services.length}</div>
          </div>
          
          {companySettings && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <h4 className="font-semibold mb-2">Configurações:</h4>
              <div className="text-xs space-y-1">
                <div>Company ID: {companySettings.company_id}</div>
                <div>Horário padrão: {companySettings.working_hours_start} - {companySettings.working_hours_end}</div>
                <div>Intervalo: {companySettings.appointment_interval}min</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Seleção de Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="booking-date">Escolha uma data</Label>
            <Input
              id="booking-date"
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
        </CardContent>
      </Card>

      {/* Time Selection */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              Horários Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTimes ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <span className="ml-2">Carregando horários...</span>
              </div>
            ) : availableTimes.length > 0 ? (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  {availableTimes.length} horários disponíveis para {getDayName(selectedDate)}:
                </p>
                <div className="grid grid-cols-6 gap-2">
                  {availableTimes.map((time) => (
                    <Button
                      key={time}
                      variant="outline"
                      size="sm"
                      className="text-sm"
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Nenhum horário disponível</p>
                <p className="text-sm">
                  {getDayName(selectedDate) === 'Sábado' || getDayName(selectedDate) === 'Domingo' 
                    ? 'Empresa fechada nos fins de semana' 
                    : 'Tente selecionar outro dia'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded text-xs">
            <div><strong>Hook loading:</strong> {loading ? 'true' : 'false'}</div>
            <div><strong>Hook error:</strong> {error || 'none'}</div>
            <div><strong>Company data loaded:</strong> {companyData ? 'true' : 'false'}</div>
            <div><strong>Company settings loaded:</strong> {companySettings ? 'true' : 'false'}</div>
            <div><strong>Services count:</strong> {services.length}</div>
            <div><strong>generateAvailableTimes function:</strong> {generateAvailableTimes ? 'available' : 'not available'}</div>
            <div><strong>Selected date:</strong> {selectedDate || 'none'}</div>
            <div><strong>Loading times:</strong> {loadingTimes ? 'true' : 'false'}</div>
            <div><strong>Available times count:</strong> {availableTimes.length}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicBookingTest;