import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAvailableTimes } from '@/hooks/useAvailableTimes';
import { useBookingSubmission } from '@/hooks/useBookingSubmission';
import { useBookingLimitsCheck } from '@/hooks/useBookingLimitsCheck';
import { usePublicBooking } from '@/hooks/usePublicBooking';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ClientForm from './ClientForm';
import ServiceSelection from './ServiceSelection';
import DateSelection from '@/components/time-slot-picker/DateSelection';
import TimeSelection from './TimeSelection';
import BookingLimitsIndicator from './BookingLimitsIndicator';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User } from 'lucide-react';
import { devLog } from '@/utils/console';
import { BookingFormData } from '@/types/publicBooking';
import { formatInBrazilTimezone } from '@/utils/timezone';

const ModernBookingForm = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  const { companySettings, services, professionals } = usePublicBooking(companySlug || '');
  
  const [formData, setFormData] = useState<BookingFormData>({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    selectedDate: '',
    selectedTime: '',
    selectedService: '',
    selectedProfessional: ''
  });

  const {
    generateAvailableDates,
    generateAvailableTimes,
    availableTimes,
    isLoading: timesLoading,
    refreshTimes,
    isConnected,
    isSyncing,
    lastSync,
    nextRefresh
  } = useAvailableTimes(companySettings);

  const { limits, isLoading: limitsLoading, refreshLimits } = useBookingLimitsCheck(
    companySettings?.company_id || '',
    formData.clientPhone
  );

  const { submitBooking, submitting, validationStep } = useBookingSubmission(
    companySettings,
    services,
    professionals,
    () => {
      // Callback após sucesso - limpar form e atualizar tudo
      setFormData({
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        selectedDate: '',
        selectedTime: '',
        selectedService: '',
        selectedProfessional: ''
      });
      refreshTimes();
      refreshLimits();
    }
  );

  useEffect(() => {
    generateAvailableDates();
  }, [companySettings, generateAvailableDates]);

  useEffect(() => {
    if (formData.selectedDate && companySettings) {
      generateAvailableTimes(formData.selectedDate);
    }
  }, [formData.selectedDate, companySettings, generateAvailableTimes]);

  // Refresh limites quando telefone mudar
  useEffect(() => {
    if (formData.clientPhone && formData.clientPhone.length >= 10) {
      refreshLimits();
    }
  }, [formData.clientPhone, refreshLimits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação final antes de submeter
    if (!limits?.canBook) {
      return;
    }

    const success = await submitBooking(formData);
    if (success) {
      devLog('✅ Agendamento realizado com sucesso');
    }
  };

  const canProceedToBooking = () => {
    return formData.clientName && 
           formData.clientPhone && 
           formData.selectedDate && 
           formData.selectedTime && 
           formData.selectedService &&
           limits?.canBook &&
           !submitting;
  };

  if (!companySettings) {
    return <div>Carregando...</div>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Agendar Horário
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Informações de Limites */}
          <BookingLimitsIndicator 
            limits={limits}
            isLoading={limitsLoading}
            className="mb-4"
          />

          {/* Dados do Cliente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Seus Dados
            </h3>
            <ClientForm
              clientName={formData.clientName}
              clientPhone={formData.clientPhone}
              clientEmail={formData.clientEmail}
              onClientNameChange={(value) => setFormData(prev => ({ ...prev, clientName: value }))}
              onClientPhoneChange={(value) => setFormData(prev => ({ ...prev, clientPhone: value }))}
              onClientEmailChange={(value) => setFormData(prev => ({ ...prev, clientEmail: value }))}
            />
          </div>

          {/* Seleção de Serviço */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Escolha o Serviço</h3>
            <ServiceSelection
              services={services}
              selectedService={formData.selectedService}
              onServiceSelect={(serviceId) => setFormData(prev => ({ ...prev, selectedService: serviceId }))}
            />
          </div>

          {/* Seleção de Data */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Escolha a Data</h3>
            <DateSelection
              selectedDate={formData.selectedDate}
              onDateSelect={(date) => setFormData(prev => ({ ...prev, selectedDate: date, selectedTime: '' }))}
              generateAvailableDates={generateAvailableDates}
            />
          </div>

          {/* Seleção de Horário */}
          {formData.selectedDate && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Escolha o Horário
              </h3>
              <TimeSelection
                availableTimes={availableTimes}
                selectedTime={formData.selectedTime}
                onTimeSelect={(time) => setFormData(prev => ({ ...prev, selectedTime: time }))}
                isLoading={timesLoading}
                onRefresh={refreshTimes}
                isConnected={isConnected}
                isSyncing={isSyncing}
                lastSync={lastSync}
                nextRefresh={nextRefresh}
              />
            </div>
          )}

          {/* Resumo e Botão de Confirmação */}
          {formData.selectedDate && formData.selectedTime && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h4 className="font-semibold">Resumo do Agendamento</h4>
              <div className="text-sm space-y-1">
                <p><strong>Data:</strong> {formatInBrazilTimezone(formData.selectedDate, 'EEEE, dd \'de\' MMMM \'de\' yyyy')}</p>
                <p><strong>Horário:</strong> {formData.selectedTime}</p>
                <p><strong>Cliente:</strong> {formData.clientName}</p>
                {formData.selectedService && (
                  <p><strong>Serviço:</strong> {services.find(s => s.id === formData.selectedService)?.name}</p>
                )}
              </div>
            </div>
          )}

          {/* Status de Validação */}
          {submitting && validationStep && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-800">{validationStep}</span>
              </div>
            </div>
          )}

          {/* Botão de Confirmação */}
          <Button
            type="submit"
            disabled={!canProceedToBooking()}
            className="w-full h-12 text-lg"
          >
            {submitting ? 'Processando...' : 'Confirmar Agendamento'}
          </Button>

        </form>
      </CardContent>
    </Card>
  );
};

export default ModernBookingForm;
