import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useOptimizedBooking } from '@/hooks/useOptimizedBooking';
import { usePublicBooking } from '@/hooks/usePublicBooking';
import { AdvancedLoading } from '@/components/ui/advanced-loading';
import { validatePhone } from '@/utils/advancedValidation';
import { cn } from '@/lib/utils';

interface FormData {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  selectedDate: string;
  selectedTime: string;
  selectedService: string;
  notes: string;
}

const OptimizedBookingForm: React.FC = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  const { companySettings, services, isLoading: publicLoading } = usePublicBooking(companySlug || '');
  
  const {
    isLoading,
    isValidating,
    isSubmitting,
    error,
    validationErrors,
    availableTimes,
    loadAvailableTimes,
    submitBooking,
    validateForm,
    clearError,
    refreshTimes
  } = useOptimizedBooking({
    companyId: companySettings?.company_id || '',
    enableRealtime: true
  });

  const [formData, setFormData] = useState<FormData>({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    selectedDate: '',
    selectedTime: '',
    selectedService: '',
    notes: ''
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [phoneValidation, setPhoneValidation] = useState<{
    isValid: boolean;
    formatted: string;
    errors: string[];
  }>({ isValid: false, formatted: '', errors: [] });

  // Validação em tempo real do telefone
  useEffect(() => {
    if (formData.clientPhone) {
      const validation = validatePhone(formData.clientPhone);
      setPhoneValidation(validation);
    }
  }, [formData.clientPhone]);

  // Carregar horários quando data e telefone válidos
  useEffect(() => {
    if (formData.selectedDate && phoneValidation.isValid && companySettings?.company_id) {
      loadAvailableTimes(formData.selectedDate, formData.selectedService);
    }
  }, [formData.selectedDate, formData.selectedService, phoneValidation.isValid, companySettings?.company_id, loadAvailableTimes]);

  // Validação do formulário em tempo real
  useEffect(() => {
    if (Object.values(formData).some(value => value.trim() !== '')) {
      validateForm(formData);
    }
  }, [formData, validateForm]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneValidation.isValid) {
      return;
    }

    const result = await submitBooking({
      clientName: formData.clientName,
      clientPhone: phoneValidation.formatted,
      clientEmail: formData.clientEmail,
      selectedDate: formData.selectedDate,
      selectedTime: formData.selectedTime,
      selectedService: formData.selectedService,
      notes: formData.notes
    });

    if (result.success) {
      // Reset form and show success
      setFormData({
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        selectedDate: '',
        selectedTime: '',
        selectedService: '',
        notes: ''
      });
      setCurrentStep(0);
    }
  };

  const canProceedToNextStep = (step: number): boolean => {
    switch (step) {
      case 0: // Dados pessoais
        return formData.clientName.trim() !== '' && phoneValidation.isValid;
      case 1: // Serviço
        return formData.selectedService !== '';
      case 2: // Data
        return formData.selectedDate !== '';
      case 3: // Horário
        return formData.selectedTime !== '';
      default:
        return false;
    }
  };

  const steps = [
    { title: 'Seus Dados', icon: User },
    { title: 'Serviço', icon: Sparkles },
    { title: 'Data', icon: Calendar },
    { title: 'Horário', icon: Clock }
  ];

  if (publicLoading) {
    return <AdvancedLoading isLoading={true} variant="card" />;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all",
                index <= currentStep ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {React.createElement(step.icon, { className: "w-4 h-4" })}
              <span className="text-sm font-medium">{step.title}</span>
              {index < currentStep && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(steps[currentStep].icon, { className: "w-5 h-5" })}
            {steps[currentStep].title}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {/* Step 0: Dados Pessoais */}
              {currentStep === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="clientName">Nome Completo *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="clientName"
                        value={formData.clientName}
                        onChange={(e) => handleInputChange('clientName', e.target.value)}
                        placeholder="Seu nome completo"
                        className="pl-10"
                        required
                      />
                    </div>
                    {validationErrors.clientName && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-600 mt-1"
                      >
                        {validationErrors.clientName}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="clientPhone">Telefone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="clientPhone"
                        type="tel"
                        value={formData.clientPhone}
                        onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                        placeholder="(11) 99999-9999"
                        className={cn(
                          "pl-10 pr-10",
                          formData.clientPhone && (phoneValidation.isValid 
                            ? "border-green-500 focus:border-green-500" 
                            : "border-red-500 focus:border-red-500")
                        )}
                        required
                      />
                      {formData.clientPhone && (
                        <div className="absolute right-3 top-3">
                          {phoneValidation.isValid ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {phoneValidation.errors.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1"
                      >
                        {phoneValidation.errors.map((error, index) => (
                          <p key={index} className="text-sm text-red-600">
                            {error}
                          </p>
                        ))}
                      </motion.div>
                    )}
                    {phoneValidation.isValid && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-green-600 mt-1"
                      >
                        ✓ Telefone válido
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="clientEmail">Email (opcional)</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="clientEmail"
                        type="email"
                        value={formData.clientEmail}
                        onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                        placeholder="seu@email.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 1: Serviço */}
              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="grid gap-3">
                    {services.map((service) => (
                      <motion.div
                        key={service.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "p-4 border-2 rounded-lg cursor-pointer transition-all",
                          formData.selectedService === service.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                        onClick={() => handleInputChange('selectedService', service.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{service.name}</h3>
                            {service.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {service.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {service.price && (
                              <Badge variant="secondary">
                                R$ {service.price.toFixed(2)}
                              </Badge>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {service.duration}min
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Data */}
              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <Input
                    type="date"
                    value={formData.selectedDate}
                    onChange={(e) => handleInputChange('selectedDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full"
                    required
                  />
                </motion.div>
              )}

              {/* Step 3: Horário */}
              {currentStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      <span>Carregando horários...</span>
                    </div>
                  ) : availableTimes.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {availableTimes.map((time) => (
                        <motion.button
                          key={time}
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleInputChange('selectedTime', time)}
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all",
                            formData.selectedTime === time
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          {time}
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum horário disponível para esta data</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => refreshTimes(formData.selectedDate)}
                        className="mt-2"
                      >
                        Atualizar
                      </Button>
                    </div>
                  )}

                  {/* Observações */}
                  <div>
                    <Label htmlFor="notes">Observações (opcional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Alguma observação especial..."
                      rows={3}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
              >
                Anterior
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!canProceedToNextStep(currentStep) || isValidating}
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    'Próximo'
                  )}
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!canProceedToNextStep(currentStep) || isSubmitting}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Agendando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmar Agendamento
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizedBookingForm;