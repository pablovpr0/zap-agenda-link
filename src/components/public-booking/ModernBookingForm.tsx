import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Phone, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Service } from '@/types/publicBooking';

interface ModernBookingFormProps {
  services: Service[];
  availableDates: string[];
  submitting: boolean;
  onSubmit: (formData: any) => Promise<void>;
  generateAvailableTimes: (date: string, serviceDuration?: number) => string[];
}

const ModernBookingForm: React.FC<ModernBookingFormProps> = ({
  services,
  availableDates,
  submitting,
  onSubmit,
  generateAvailableTimes
}) => {
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const formRef = useRef<HTMLDivElement>(null);

  const selectedServiceData = services.find(s => s.id === selectedService);
  const availableTimes = selectedDate ? generateAvailableTimes(selectedDate, selectedServiceData?.duration) : [];

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setSelectedDate('');
    setSelectedTime('');
    setCurrentStep(2);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
    setCurrentStep(3);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setCurrentStep(4);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone) return;

    await onSubmit({
      selectedService,
      selectedDate,
      selectedTime,
      clientName,
      clientPhone,
      clientEmail: '',
      notes: ''
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1: return !!selectedService;
      case 2: return !!selectedDate;
      case 3: return !!selectedTime;
      case 4: return !!(clientName && clientPhone);
      default: return false;
    }
  };

  return (
    <div ref={formRef} className="max-w-2xl mx-auto px-4 py-8">
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm public-card-border shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="text-center pb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <Sparkles className="inline-block mr-2 h-6 w-6 text-blue-600" />
            Agendar Horário
          </CardTitle>
          
          {/* Progress Steps */}
          <div className="flex justify-center mt-4 space-x-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  isStepComplete(step)
                    ? 'bg-green-500 scale-110'
                    : currentStep === step
                    ? 'bg-blue-500 scale-110'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Step 1: Service Selection */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isStepComplete(1) ? 'bg-green-500' : 'bg-blue-500'
              } text-white`}>
                {isStepComplete(1) ? <CheckCircle className="h-4 w-4" /> : '1'}
              </div>
              <Label className="text-lg font-semibold">Escolha o serviço</Label>
            </div>
            
            <div className="grid gap-3">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg public-card-border ${
                    selectedService === service.id
                      ? 'ring-2 ring-[var(--public-theme-primary)] bg-blue-50 dark:bg-blue-950/50'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => handleServiceSelect(service.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{service.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{service.description}</p>
                        <div className="flex items-center mt-2 space-x-4">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {service.duration}min
                          </Badge>
                          {service.price && (
                            <Badge variant="outline" className="text-xs text-green-600">
                              R$ {service.price}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {selectedService === service.id && (
                        <CheckCircle className="h-6 w-6 text-blue-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Step 2: Date Selection */}
          {currentStep >= 2 && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isStepComplete(2) ? 'bg-green-500' : 'bg-blue-500'
                } text-white`}>
                  {isStepComplete(2) ? <CheckCircle className="h-4 w-4" /> : '2'}
                </div>
                <Label className="text-lg font-semibold">Escolha a data</Label>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableDates.slice(0, 6).map((date) => (
                  <Button
                    key={date}
                    variant={selectedDate === date ? "default" : "outline"}
                    className={`p-4 h-auto justify-start transition-all duration-300 ${
                      selectedDate === date
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'hover:bg-blue-50 dark:hover:bg-blue-950'
                    }`}
                    onClick={() => handleDateSelect(date)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">{formatDate(date)}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Time Selection */}
          {currentStep >= 3 && availableTimes.length > 0 && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isStepComplete(3) ? 'bg-green-500' : 'bg-blue-500'
                } text-white`}>
                  {isStepComplete(3) ? <CheckCircle className="h-4 w-4" /> : '3'}
                </div>
                <Label className="text-lg font-semibold">Escolha o horário</Label>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableTimes.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    className={`transition-all duration-300 ${
                      selectedTime === time
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'hover:bg-blue-50 dark:hover:bg-blue-950'
                    }`}
                    onClick={() => handleTimeSelect(time)}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Client Information */}
          {currentStep >= 4 && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isStepComplete(4) ? 'bg-green-500' : 'bg-blue-500'
                } text-white`}>
                  {isStepComplete(4) ? <CheckCircle className="h-4 w-4" /> : '4'}
                </div>
                <Label className="text-lg font-semibold">Seus dados</Label>
              </div>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Nome completo
                  </Label>
                  <Input
                    id="name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Digite seu nome completo"
                    className="transition-all duration-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Label>
                  <Input
                    id="phone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="transition-all duration-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Summary */}
              {selectedService && selectedDate && selectedTime && (
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 public-card-border">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Resumo do agendamento:</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Serviço:</strong> {selectedServiceData?.name}</p>
                      <p><strong>Data:</strong> {formatDate(selectedDate)}</p>
                      <p><strong>Horário:</strong> {selectedTime}</p>
                      <p><strong>Duração:</strong> {selectedServiceData?.duration} minutos</p>
                      {selectedServiceData?.price && (
                        <p><strong>Valor:</strong> R$ {selectedServiceData.price}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                type="submit"
                disabled={submitting || !clientName || !clientPhone}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Confirmando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Confirmar Agendamento
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </div>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernBookingForm;