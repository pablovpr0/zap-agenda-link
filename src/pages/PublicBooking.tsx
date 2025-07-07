
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MessageCircle, Calendar } from 'lucide-react';
import PublicCalendar from '@/components/PublicCalendar';
import CompanyHeader from '@/components/public-booking/CompanyHeader';
import ServiceSelection from '@/components/public-booking/ServiceSelection';
import TimeSelection from '@/components/public-booking/TimeSelection';
import ClientForm from '@/components/public-booking/ClientForm';
import { usePublicBooking } from '@/hooks/usePublicBooking';

const PublicBooking = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  
  // Form data
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');

  const {
    companySettings,
    profile,
    services,
    loading,
    submitting,
    generateAvailableDates,
    generateAvailableTimes,
    submitBooking
  } = usePublicBooking(companySlug || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await submitBooking({
      selectedService,
      selectedDate,
      selectedTime,
      clientName,
      clientPhone,
      clientEmail,
      notes
    });

    if (success) {
      // Limpar formulário
      setSelectedService('');
      setSelectedDate('');
      setSelectedTime('');
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setNotes('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">ZapAgenda</div>
          <div className="text-gray-600">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!companySettings || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-red-600">Empresa não encontrada</div>
          <div className="text-gray-600">Verifique se o link está correto.</div>
        </div>
      </div>
    );
  }

  const availableDates = generateAvailableDates();
  const availableTimes = generateAvailableTimes(selectedDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header estilo WhatsApp Business */}
        <CompanyHeader companySettings={companySettings} profile={profile} />

        {/* Formulário de agendamento */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Serviço */}
              <ServiceSelection
                services={services}
                selectedService={selectedService}
                onServiceChange={setSelectedService}
              />

              {/* Calendário */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-500" />
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
                <TimeSelection
                  availableTimes={availableTimes}
                  selectedTime={selectedTime}
                  onTimeSelect={setSelectedTime}
                />
              )}

              {/* Dados do cliente */}
              <ClientForm
                clientName={clientName}
                clientPhone={clientPhone}
                clientEmail={clientEmail}
                notes={notes}
                onNameChange={setClientName}
                onPhoneChange={setClientPhone}
                onEmailChange={setClientEmail}
                onNotesChange={setNotes}
              />

              <Button 
                type="submit" 
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 text-lg font-semibold rounded-xl shadow-lg"
                disabled={submitting}
              >
                {submitting ? (
                  "Agendando..."
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Confirmar Agendamento
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Links sociais */}
        {companySettings?.instagram_url && (
          <div className="text-center mt-6">
            <Button variant="outline" asChild className="border-green-200 text-green-600 hover:bg-green-50">
              <a 
                href={companySettings.instagram_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                📱 Siga no Instagram
              </a>
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-400">
          Powered by ZapAgenda
        </div>
      </div>
    </div>
  );
};

export default PublicBooking;
