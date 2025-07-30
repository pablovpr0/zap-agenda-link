
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MessageCircle, Calendar, Clock, RefreshCw } from 'lucide-react';
import PublicCalendar from '@/components/PublicCalendar';
import ServiceSelection from '@/components/public-booking/ServiceSelection';
import TimeSelection from '@/components/public-booking/TimeSelection';
import ClientForm from '@/components/public-booking/ClientForm';
import { Service } from '@/types/publicBooking';

interface BookingFormProps {
  services: Service[];
  availableDates: Date[];
  submitting: boolean;
  onSubmit: (formData: {
    selectedService: string;
    selectedDate: string;
    selectedTime: string;
    clientName: string;
    clientPhone: string;
  }) => Promise<boolean>;
  generateAvailableTimes: (selectedDate: string) => Promise<string[]>;
}

const BookingForm = ({ 
  services, 
  availableDates, 
  submitting, 
  onSubmit, 
  generateAvailableTimes 
}: BookingFormProps) => {
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  // Load available times when date changes
  useEffect(() => {
    const loadAvailableTimes = async () => {
      if (selectedDate) {
        console.log('🔄 Carregando horários para:', selectedDate);
        setLoadingTimes(true);
        setSelectedTime(''); // Clear selected time when date changes
        
        try {
          const times = await generateAvailableTimes(selectedDate);
          setAvailableTimes(times);
          console.log('✅ Horários carregados:', times.length);
        } catch (error) {
          console.error('❌ Erro ao carregar horários:', error);
          setAvailableTimes([]);
        } finally {
          setLoadingTimes(false);
        }
      } else {
        setAvailableTimes([]);
        setSelectedTime('');
      }
    };

    loadAvailableTimes();
  }, [selectedDate, generateAvailableTimes]);

  // Refresh available times manually
  const refreshAvailableTimes = async () => {
    if (selectedDate) {
      console.log('🔄 Atualizando horários manualmente...');
      setLoadingTimes(true);
      setSelectedTime(''); // Clear selected time
      
      try {
        const times = await generateAvailableTimes(selectedDate);
        setAvailableTimes(times);
        console.log('✅ Horários atualizados:', times.length);
      } catch (error) {
        console.error('❌ Erro ao atualizar horários:', error);
      } finally {
        setLoadingTimes(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📤 Enviando formulário de agendamento...');
    console.log('📋 Dados:', {
      selectedService,
      selectedDate,
      selectedTime,
      clientName,
      clientPhone: clientPhone ? `${clientPhone.substring(0, 4)}****` : ''
    });
    
    const success = await onSubmit({
      selectedService,
      selectedDate,
      selectedTime,
      clientName,
      clientPhone
    });

    if (success) {
      console.log('✅ Agendamento realizado com sucesso');
      // Limpar formulário
      setSelectedService('');
      setSelectedDate('');
      setSelectedTime('');
      setClientName('');
      setClientPhone('');
      setAvailableTimes([]);
    }
  };

  return (
    <Card className="shadow-2xl border-0 bg-white rounded-2xl overflow-hidden">
      <CardHeader className="pb-6 bg-gradient-to-r from-green-500 to-blue-500 text-white">
        <CardTitle className="text-xl text-center flex items-center justify-center gap-3">
          <Clock className="w-6 h-6" />
          Dados do Agendamento
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Serviço */}
          <ServiceSelection
            services={services}
            selectedService={selectedService}
            onServiceChange={setSelectedService}
          />

          {/* Calendário */}
          <div className="space-y-3">
            <Label className="text-gray-700 font-semibold flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-green-500" />
              Escolha a data
            </Label>
            <PublicCalendar
              availableDates={availableDates}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>

          {/* Horário */}
          {selectedDate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700 font-semibold flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5 text-green-500" />
                  Escolha o horário
                </Label>
                {!loadingTimes && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={refreshAvailableTimes}
                    className="text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Atualizar
                  </Button>
                )}
              </div>
              
              {loadingTimes ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                  <span className="ml-2 text-gray-500">Carregando horários...</span>
                </div>
              ) : (
                <TimeSelection
                  availableTimes={availableTimes}
                  selectedTime={selectedTime}
                  onTimeSelect={setSelectedTime}
                />
              )}
            </div>
          )}

          {/* Dados do cliente */}
          <ClientForm
            clientName={clientName}
            clientPhone={clientPhone}
            onNameChange={setClientName}
            onPhoneChange={setClientPhone}
          />

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-6 text-lg font-bold rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
            disabled={submitting || !selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone}
          >
            {submitting ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Agendando...
              </div>
            ) : (
              <>
                <MessageCircle className="w-6 h-6 mr-3" />
                Confirmar Agendamento
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BookingForm;
