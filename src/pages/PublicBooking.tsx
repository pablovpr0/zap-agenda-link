
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MessageCircle, Calendar, Clock, CheckCircle } from 'lucide-react';
import PublicCalendar from '@/components/PublicCalendar';
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
        {/* Header da empresa */}
        <div className="text-center mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
            {companySettings.logo_url && (
              <div className="flex justify-center mb-4">
                <img 
                  src={companySettings.logo_url} 
                  alt={profile.company_name} 
                  className="w-16 h-16 rounded-full object-cover"
                />
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {profile.company_name}
            </h1>
            {profile.business_type && (
              <p className="text-gray-600 text-sm mb-3">{profile.business_type}</p>
            )}
            {companySettings.welcome_message && (
              <p className="text-gray-700 text-sm leading-relaxed">
                {companySettings.welcome_message}
              </p>
            )}
          </div>
        </div>

        {/* Seção informativa sobre agendamento */}
        <div className="mb-6 bg-white rounded-xl p-6 shadow-sm border border-green-100">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Agende seu horário
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Escolha o melhor horário para você e confirme seu agendamento de forma rápida e prática
              </p>
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Confirmação instantânea</span>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário de agendamento */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-center text-gray-800 flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 text-green-500" />
              Dados do Agendamento
            </CardTitle>
          </CardHeader>
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
