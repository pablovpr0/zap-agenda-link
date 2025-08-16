
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MessageCircle, Calendar, Clock } from 'lucide-react';
import PublicCalendar from '@/components/PublicCalendar';
import ServiceSelection from '@/components/public-booking/ServiceSelection';
import TimeSelection from '@/components/public-booking/TimeSelection';
import ClientForm from '@/components/public-booking/ClientForm';
import { Service } from '@/types/publicBooking';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';
import { isPhoneValidFormat } from '@/utils/inputValidation';

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
  generateAvailableTimes: (selectedDate: string, serviceDuration?: number) => Promise<string[]>;
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
  const [clientEmail, setClientEmail] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  // Load available times when date or service changes - só se telefone estiver válido
  useEffect(() => {
    const loadAvailableTimes = async () => {
      if (selectedDate && isPhoneValidFormat(clientPhone)) {
        // Encontrar duração do serviço selecionado
        const selectedServiceData = services.find(s => s.id === selectedService);
        const serviceDuration = selectedServiceData?.duration;
        
        devLog('🔄 Carregando horários para:', { selectedDate, selectedService, serviceDuration });
        
        const times = await generateAvailableTimes(selectedDate, serviceDuration);
        setAvailableTimes(times);
        
        // Limpar horário selecionado se não estiver mais disponível
        if (selectedTime && !times.includes(selectedTime)) {
          setSelectedTime('');
        }
      } else {
        setAvailableTimes([]);
      }
    };

    loadAvailableTimes();
  }, [selectedDate, selectedService, generateAvailableTimes, services, selectedTime, clientPhone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await onSubmit({
      selectedService,
      selectedDate,
      selectedTime,
      clientName,
      clientPhone
    });

    if (success) {
      // Limpar formulário
      setSelectedService('');
      setSelectedDate('');
      setSelectedTime('');
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setAvailableTimes([]);
    }
  };

  return (
    <Card className="shadow-2xl public-card-border bg-white public-surface rounded-2xl overflow-hidden">
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
            onServiceSelect={setSelectedService}
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
            <>
              {!isPhoneValidFormat(clientPhone) ? (
                <div className="space-y-3">
                  <Label className="text-gray-700 font-semibold flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5 text-green-500" />
                    Escolha o horário
                  </Label>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-amber-800">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Complete o telefone para ver os horários disponíveis
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 mt-1">
                      Digite um telefone válido no formato (11) 99999-9999
                    </p>
                  </div>
                </div>
              ) : (
                <TimeSelection
                  availableTimes={availableTimes}
                  selectedTime={selectedTime}
                  onTimeSelect={setSelectedTime}
                />
              )}
            </>
          )}

          {/* Dados do cliente */}
          <ClientForm
            clientName={clientName}
            clientPhone={clientPhone}
            clientEmail={clientEmail}
            onClientNameChange={setClientName}
            onClientPhoneChange={setClientPhone}
            onClientEmailChange={setClientEmail}
          />

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-6 text-lg font-bold rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
            disabled={submitting}
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
