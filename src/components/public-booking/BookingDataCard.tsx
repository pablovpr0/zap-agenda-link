import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import PublicCalendar from '@/components/PublicCalendar';
import { format } from 'date-fns';
import { ServiceSelection } from '@/components/public-booking/ServiceSelection';
import { TimeSlotSelection } from '@/components/public-booking/TimeSlotSelection';
import { ClientInfoForm } from '@/components/public-booking/ClientInfoForm';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

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
  const handleDateSelect = (date: Date) => {
    // Convert Date to string format
    const dateString = format(date, 'yyyy-MM-dd');
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
        <ServiceSelection
          services={services}
          selectedService={formData.selectedService}
          onServiceChange={(serviceId) =>
            onFormDataChange({ ...formData, selectedService: serviceId })
          }
        />

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
        <TimeSlotSelection
          availableTimes={availableTimes}
          selectedTime={selectedTime}
          onTimeSelect={onTimeSelect}
          loading={timesLoading}
        />

        {/* Step 4: Client Information Form */}
        <ClientInfoForm
          formData={formData}
          onFormDataChange={onFormDataChange}
          companyData={companyData}
          professionals={professionals}
        />

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
