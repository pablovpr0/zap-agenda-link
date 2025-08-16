import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAvailableTimes } from '@/hooks/useAvailableTimes';
import { useBookingSubmission } from '@/hooks/useBookingSubmission';
import { useBookingLimitsCheck } from '@/hooks/useBookingLimitsCheck';
import { usePublicBooking } from '@/hooks/usePublicBooking';
import { usePublicCompanySettings } from '@/hooks/useCompanySettingsRealtime';
import { generateDynamicSchedule } from '@/services/dynamicScheduleService';
import { validateBookingRequest, createBookingWithConcurrencyControl } from '@/services/bookingConcurrencyService';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ClientForm from './ClientForm';
import ServiceSelection from './ServiceSelection';
import DateSelection from '@/components/time-slot-picker/DateSelection';
import TimeSelection from './TimeSelection';
import BookingLimitsIndicator from './BookingLimitsIndicator';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { devLog } from '@/utils/console';
import { BookingFormData } from '@/types/publicBooking';
import { formatInBrazilTimezone } from '@/utils/timezone';
import { isPhoneValidFormat } from '@/utils/inputValidation';

const ModernBookingForm = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  const { companySettings, services, professionals } = usePublicBooking(companySlug || '');
  
  // Usar as novas configurações dinâmicas
  const { 
    settings: dynamicSettings, 
    isLoading: settingsLoading,
    isDateAllowed,
    isDayActive 
  } = usePublicCompanySettings(companySettings?.company_id || '');
  
  const [formData, setFormData] = useState<BookingFormData>({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    selectedDate: '',
    selectedTime: '',
    selectedService: '',
    selectedProfessional: ''
  });

  const [availableTimesLocal, setAvailableTimesLocal] = useState<string[]>([]);
  const [timesLoading, setTimesLoading] = useState(false);

  // Função para carregar horários usando as configurações dinâmicas
  const loadDynamicTimes = useCallback(async (selectedDate: string) => {
    if (!dynamicSettings || !companySettings?.company_id) return;
    
    setTimesLoading(true);
    try {
      const times = await generateDynamicSchedule(
        companySettings.company_id,
        dynamicSettings,
        selectedDate
      );
      setAvailableTimesLocal(times);
    } catch (error) {
      devLog('❌ Erro ao carregar horários dinâmicos:', error);
      setAvailableTimesLocal([]);
    } finally {
      setTimesLoading(false);
    }
  }, [dynamicSettings, companySettings?.company_id]);

  const refreshTimes = useCallback(() => {
    if (formData.selectedDate) {
      loadDynamicTimes(formData.selectedDate);
    }
  }, [formData.selectedDate, loadDynamicTimes]);

  const { limits, isLoading: limitsLoading, refreshLimits } = useBookingLimitsCheck(
    companySettings?.company_id || '',
    formData.clientPhone
  );

  const [submitting, setSubmitting] = useState(false);
  const [validationStep, setValidationStep] = useState<string>('');

  // Função para submeter agendamento com controle de concorrência
  const submitBookingWithConcurrency = useCallback(async (data: BookingFormData): Promise<boolean> => {
    if (!companySettings?.company_id) return false;
    
    setSubmitting(true);
    setValidationStep('Validando dados...');
    
    try {
      // Validação prévia
      setValidationStep('Verificando disponibilidade...');
      const validation = await validateBookingRequest(
        companySettings.company_id,
        data.clientPhone,
        data.selectedDate,
        data.selectedTime,
        30 // duração padrão
      );

      if (!validation.isValid) {
        alert(validation.errors.join('\n'));
        return false;
      }

      // Criar agendamento
      setValidationStep('Criando agendamento...');
      const result = await createBookingWithConcurrencyControl({
        company_id: companySettings.company_id,
        client_name: data.clientName,
        client_phone: data.clientPhone,
        client_email: data.clientEmail,
        appointment_date: data.selectedDate,
        appointment_time: data.selectedTime,
        service_id: data.selectedService,
        service_duration: 30,
        professional_id: data.selectedProfessional
      });

      if (result.success) {
        // Limpar formulário
        setFormData({
          clientName: '',
          clientPhone: '',
          clientEmail: '',
          selectedDate: '',
          selectedTime: '',
          selectedService: '',
          selectedProfessional: ''
        });
        
        // Atualizar horários
        refreshTimes();
        refreshLimits();
        
        alert('Agendamento realizado com sucesso!');
        return true;
      } else {
        alert(result.error || 'Erro ao criar agendamento');
        return false;
      }
      
    } catch (error) {
      devLog('❌ Erro no agendamento:', error);
      alert('Erro interno ao processar agendamento');
      return false;
    } finally {
      setSubmitting(false);
      setValidationStep('');
    }
  }, [companySettings?.company_id, refreshTimes, refreshLimits]);

  // Carregar horários quando data ou telefone mudarem
  useEffect(() => {
    if (formData.selectedDate && dynamicSettings && isPhoneValidFormat(formData.clientPhone)) {
      loadDynamicTimes(formData.selectedDate);
    } else {
      setAvailableTimesLocal([]);
    }
  }, [formData.selectedDate, dynamicSettings, formData.clientPhone, loadDynamicTimes]);

  // Refresh limites quando telefone mudar - só se estiver completo e válido
  useEffect(() => {
    if (isPhoneValidFormat(formData.clientPhone)) {
      refreshLimits();
    }
  }, [formData.clientPhone, refreshLimits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação final antes de submeter
    if (!limits?.canBook) {
      alert('Limite de agendamentos atingido');
      return;
    }

    const success = await submitBookingWithConcurrency(formData);
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
              generateAvailableDates={async () => {
                if (!dynamicSettings) return [];
                
                const dates: Date[] = [];
                const today = new Date();
                
                for (let i = 0; i <= dynamicSettings.advance_booking_limit; i++) {
                  const date = new Date(today);
                  date.setDate(today.getDate() + i);
                  
                  if (isDateAllowed(date)) {
                    dates.push(date);
                  }
                }
                
                return dates;
              }}
            />
          </div>

          {/* Seleção de Horário */}
          {formData.selectedDate && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Escolha o Horário
              </h3>
              
              {!isPhoneValidFormat(formData.clientPhone) ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Complete o telefone para ver os horários disponíveis
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    Digite um telefone válido no formato (11) 99999-9999
                  </p>
                </div>
              ) : (
                <TimeSelection
                  availableTimes={availableTimesLocal}
                  selectedTime={formData.selectedTime}
                  onTimeSelect={(time) => setFormData(prev => ({ ...prev, selectedTime: time }))}
                  isLoading={timesLoading}
                  onRefresh={refreshTimes}
                  isConnected={true}
                  isSyncing={false}
                  lastSync={new Date()}
                  nextRefresh={0}
                />
              )}
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
