
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MessageCircle, Calendar, Clock, CheckCircle, Star } from 'lucide-react';
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
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

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

  // Load available times when date changes
  useEffect(() => {
    const loadAvailableTimes = async () => {
      if (selectedDate) {
        const times = await generateAvailableTimes(selectedDate);
        setAvailableTimes(times);
      } else {
        setAvailableTimes([]);
      }
    };

    loadAvailableTimes();
  }, [selectedDate, generateAvailableTimes]);

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
      setAvailableTimes([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <div className="text-xl font-bold text-green-600 mb-2">ZapAgenda</div>
          <div className="text-gray-600">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!companySettings || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <div className="text-xl font-bold text-red-600 mb-2">Empresa não encontrada</div>
          <div className="text-gray-600">Verifique se o link está correto.</div>
        </div>
      </div>
    );
  }

  const availableDates = generateAvailableDates();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header da empresa - Melhorado */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-green-100 relative overflow-hidden">
            {/* Decoração de fundo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-blue-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-100 to-pink-100 rounded-full translate-y-12 -translate-x-12 opacity-50"></div>
            
            <div className="relative z-10">
              {companySettings.logo_url && (
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <img 
                      src={companySettings.logo_url} 
                      alt={profile.company_name} 
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              )}
              
              <h1 className="text-3xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                {profile.company_name}
              </h1>
              
              {profile.business_type && (
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <Star className="w-4 h-4" />
                  {profile.business_type}
                </div>
              )}
              
              {companySettings.welcome_message && (
                <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl">
                  {companySettings.welcome_message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Seção informativa sobre agendamento - Melhorada */}
        <div className="mb-8 bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-full">
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Agende seu horário
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Escolha o melhor horário para você e confirme seu agendamento de forma rápida e prática
              </p>
              <div className="flex items-center justify-center gap-3 text-green-600 bg-green-50 p-3 rounded-xl">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-semibold">Confirmação instantânea</span>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário de agendamento - Melhorado */}
        <Card className="shadow-2xl border-0 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-6 bg-gradient-to-r from-green-500 to-blue-500 text-white">
            <CardTitle className="text-xl text-center flex items-center justify-center gap-3">
              <Clock className="w-6 h-6" />
              Dados do Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Serviço */}
              <ServiceSelection
                services={services}
                selectedService={selectedService}
                onServiceChange={setSelectedService}
              />

              {/* Calendário */}
              <div className="space-y-3">
                <Label className="text-gray-700 font-semibold flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-green-500" />
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
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-6 text-lg font-bold rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Agendando...
                  </div>
                ) : (
                  <>
                    <MessageCircle className="w-6 h-6 mr-3" />
                    Confirmar Agendamento
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Links sociais */}
        {companySettings?.instagram_url && (
          <div className="text-center mt-8">
            <Button variant="outline" asChild className="border-green-200 text-green-600 hover:bg-green-50 rounded-xl px-6 py-3">
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
