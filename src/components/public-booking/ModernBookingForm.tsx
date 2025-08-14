
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, User, Phone, Mail, CheckCircle } from 'lucide-react';
import { formatToBrasilia } from '@/utils/timezone';
import { toast } from 'sonner';
import { devLog, devError } from '@/utils/console';
import { validatePhone, validateEmail, validateName } from '@/utils/inputValidation';

interface BookingFormData {
  serviceName: string;
  servicePrice?: number;
  serviceDuration: number;
  selectedDate: string;
  selectedTime: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
}

interface ModernBookingFormProps {
  formData: BookingFormData;
  onSubmit: (data: BookingFormData) => Promise<void>;
  isSubmitting: boolean;
}

const ModernBookingForm: React.FC<ModernBookingFormProps> = ({
  formData,
  onSubmit,
  isSubmitting
}) => {
  const [localFormData, setLocalFormData] = useState(formData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalFormData(formData);
  }, [formData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!validateName(localFormData.clientName)) {
      newErrors.clientName = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!validatePhone(localFormData.clientPhone)) {
      newErrors.clientPhone = 'Telefone deve ter formato válido';
    }

    if (!validateEmail(localFormData.clientEmail)) {
      newErrors.clientEmail = 'Email deve ter formato válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    try {
      await onSubmit(localFormData);
    } catch (error) {
      devError('Erro ao enviar formulário:', error);
      toast.error('Erro ao confirmar agendamento');
    }
  };

  const formatSelectedDate = (dateStr: string) => {
    if (!dateStr) return '';
    return formatToBrasilia(new Date(dateStr + 'T12:00:00'), "EEEE, dd 'de' MMMM 'de' yyyy");
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Card className="bg-white shadow-xl border-0 rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Confirmar Agendamento</h2>
            <p className="opacity-90">Preencha seus dados para finalizar</p>
          </div>

          {/* Booking Summary */}
          <div className="p-6 bg-gray-50 border-b">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-semibold">{localFormData.serviceName}</p>
                  {localFormData.servicePrice && (
                    <p className="text-sm text-gray-600">R$ {localFormData.servicePrice.toFixed(2)}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-500" />
                <p className="text-sm">{formatSelectedDate(localFormData.selectedDate)}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-purple-500" />
                <p className="text-sm">{localFormData.selectedTime} ({localFormData.serviceDuration} min)</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="clientName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nome completo
              </Label>
              <Input
                id="clientName"
                type="text"
                value={localFormData.clientName}
                onChange={(e) => setLocalFormData(prev => ({ ...prev, clientName: e.target.value }))}
                className={`${errors.clientName ? 'border-red-500' : ''}`}
                placeholder="Seu nome completo"
                required
              />
              {errors.clientName && (
                <p className="text-red-500 text-sm">{errors.clientName}</p>
              )}
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="clientPhone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefone
              </Label>
              <Input
                id="clientPhone"
                type="tel"
                value={localFormData.clientPhone}
                onChange={(e) => setLocalFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                className={`${errors.clientPhone ? 'border-red-500' : ''}`}
                placeholder="(11) 99999-9999"
                required
              />
              {errors.clientPhone && (
                <p className="text-red-500 text-sm">{errors.clientPhone}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="clientEmail" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="clientEmail"
                type="email"
                value={localFormData.clientEmail}
                onChange={(e) => setLocalFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                className={`${errors.clientEmail ? 'border-red-500' : ''}`}
                placeholder="seu@email.com"
                required
              />
              {errors.clientEmail && (
                <p className="text-red-500 text-sm">{errors.clientEmail}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              {isSubmitting ? 'Confirmando...' : 'Confirmar Agendamento'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernBookingForm;
