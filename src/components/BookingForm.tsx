
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DatePicker from './DatePicker';
import TimePicker from './TimePicker';
import { ArrowLeft, User, Phone, MessageSquare, Calendar, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BookingFormProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

const BookingForm = ({ onComplete, onBack }: BookingFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: '',
    date: '',
    time: '',
    notes: ''
  });

  const services = [
    "Corte Feminino",
    "Corte Masculino", 
    "Escova",
    "Coloração",
    "Manicure",
    "Pedicure"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.service || !formData.date || !formData.time) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    // Simular envio do agendamento
    toast({
      title: "Agendamento realizado!",
      description: "Seu agendamento foi confirmado com sucesso.",
    });

    onComplete(formData);
  };

  const handleDateSelect = (date: string) => {
    setFormData(prev => ({ ...prev, date }));
  };

  const handleTimeSelect = (time: string) => {
    setFormData(prev => ({ ...prev, time }));
  };

  return (
    <div className="p-4 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-xl font-bold text-gray-800">Fazer Agendamento</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Seus Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Nome Completo *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Digite seu nome completo"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                WhatsApp *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="mt-1"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Service Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Serviço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Escolha o serviço *
              </Label>
              <Select 
                value={formData.service} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, service: value }))}
                required
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Date and Time */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Data e Horário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DatePicker onDateSelect={handleDateSelect} selectedDate={formData.date} />
            {formData.date && (
              <TimePicker onTimeSelect={handleTimeSelect} selectedTime={formData.time} />
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Alguma observação especial? (opcional)"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="min-h-[80px]"
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-lg font-medium"
          size="lg"
        >
          <Clock className="w-5 h-5 mr-2" />
          Confirmar Agendamento
        </Button>
      </form>
    </div>
  );
};

export default BookingForm;
