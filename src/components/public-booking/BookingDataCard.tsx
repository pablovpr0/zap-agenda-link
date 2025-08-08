
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import PublicCalendar from '@/components/PublicCalendar';
import { format } from 'date-fns';
import ServiceSelection from '@/components/public-booking/ServiceSelection';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price?: number;
}

interface Professional {
  id: string;
  name: string;
}

interface BookingFormData {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  selectedService: string;
  selectedProfessional?: string;
}

interface BookingDataCardProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  availableDates: Date[];
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  availableTimes: string[];
  timesLoading: boolean;
  onSubmit: () => void;
  submitting: boolean;
  formData: BookingFormData;
  onFormDataChange: (data: BookingFormData) => void;
  services: Service[];
  companyData: any;
  professionals: Professional[];
}

const BookingDataCard: React.FC<BookingDataCardProps> = ({
  selectedDate,
  onDateSelect,
  availableDates,
  selectedTime,
  onTimeSelect,
  availableTimes,
  timesLoading,
  onSubmit,
  submitting,
  formData,
  onFormDataChange,
  services,
  companyData,
  professionals
}) => {
  const handleDateSelect = (dateString: string) => {
    onDateSelect(dateString);
  };

  const today = new Date();
  const formattedToday = format(today, 'yyyy-MM-dd');

  return (
    <Card className="w-full bg-white/95 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="pb-2 pt-4 px-4 md:px-6">
        <CardTitle className="text-xl font-bold text-gray-800">
          Agende seu horário
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6 space-y-6">
        {/* Step 1: Service Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium text-gray-800">1. Escolha um serviço</Label>
          <ServiceSelection
            services={services}
            selectedService={formData.selectedService}
            onServiceChange={(serviceId) =>
              onFormDataChange({ ...formData, selectedService: serviceId })
            }
          />
        </div>

        {/* Step 2: Date Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium text-gray-800">2. Escolha uma data</Label>
          <PublicCalendar
            availableDates={availableDates}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
        </div>

        {/* Step 3: Time Slot Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium text-gray-800">3. Escolha um horário</Label>
          <Select value={selectedTime} onValueChange={onTimeSelect} disabled={!selectedDate || timesLoading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={selectedDate ? "Selecione um horário" : "Selecione uma data primeiro"} />
            </SelectTrigger>
            <SelectContent>
              {availableTimes.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Step 4: Client Information */}
        <div className="space-y-4">
          <Label className="text-base font-medium text-gray-800">4. Dados Pessoais</Label>
          <Input
            type="text"
            placeholder="Nome Completo"
            value={formData.clientName}
            onChange={(e) => onFormDataChange({ ...formData, clientName: e.target.value })}
            required
          />
          <Input
            type="tel"
            placeholder="Telefone"
            value={formData.clientPhone}
            onChange={(e) => onFormDataChange({ ...formData, clientPhone: e.target.value })}
            required
          />
          {formData.clientEmail !== undefined && (
            <Input
              type="email"
              placeholder="Email (opcional)"
              value={formData.clientEmail || ''}
              onChange={(e) => onFormDataChange({ ...formData, clientEmail: e.target.value })}
            />
          )}
        </div>

        {/* Submit Button */}
        <Button
          className="w-full h-11 text-lg font-bold"
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Aguarde...
            </>
          ) : (
            "Reservar Agora"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BookingDataCard;
