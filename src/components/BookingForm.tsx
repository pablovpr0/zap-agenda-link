import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import PublicCalendar from './PublicCalendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BookingFormData {
  clientName: string;
  clientPhone: string;
  selectedDate: string;
  selectedTime: string;
}

interface BookingFormProps {
  selectedDate: Date | null;
  onDateSelect: (date: string) => void;
  availableDates: Date[];
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  availableTimes: string[];
  onSubmit: (data: BookingFormData) => void;
  loading: boolean;
  companyData: any;
}

const BookingForm: React.FC<BookingFormProps> = ({
  selectedDate,
  onDateSelect,
  availableDates,
  selectedTime,
  onTimeSelect,
  availableTimes,
  onSubmit,
  loading,
  companyData
}) => {
  const [formData, setFormData] = useState<BookingFormData>({
    clientName: '',
    clientPhone: '',
    selectedDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    selectedTime: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleTimeSelect = (time: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTime: time,
    }));
    onTimeSelect(time);
  };

  const handleDateSelect = (date: Date) => {
    // Convert Date to string format expected by parent
    const dateString = format(date, 'yyyy-MM-dd');
    onDateSelect(dateString);
    setFormData(prev => ({
      ...prev,
      selectedDate: dateString,
    }));
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Agendamento Online</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Step 1: Date Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">1. Escolha uma data</Label>
          <PublicCalendar
            availableDates={availableDates}
            selectedDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
            onDateSelect={handleDateSelect}
          />
        </div>

        {/* Step 2: Time Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">2. Escolha um horário</Label>
          <Select value={selectedTime} onValueChange={handleTimeSelect} disabled={!selectedDate || loading}>
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

        {/* Step 3: Personal Information */}
        <div className="space-y-4">
          <Label className="text-base font-medium">3. Dados Pessoais</Label>
          <Input
            type="text"
            name="clientName"
            placeholder="Nome Completo"
            value={formData.clientName}
            onChange={handleInputChange}
            required
          />
          <Input
            type="tel"
            name="clientPhone"
            placeholder="Telefone"
            value={formData.clientPhone}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Submit Button */}
        <Button onClick={handleSubmit} className="w-full" disabled={loading || !formData.clientName || !formData.clientPhone || !selectedDate || !selectedTime}>
          {loading ? "Carregando..." : "Agendar"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BookingForm;
