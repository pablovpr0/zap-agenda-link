
import { useState } from 'react';
import MerchantProfile from '../components/MerchantProfile';
import BookingForm from '../components/BookingForm';
import { Button } from '@/components/ui/button';
import { MessageCircle, Calendar, CheckCircle } from 'lucide-react';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<'profile' | 'booking' | 'success'>('profile');
  const [bookingData, setBookingData] = useState<any>(null);

  const handleBookingComplete = (data: any) => {
    setBookingData(data);
    setCurrentStep('success');
    console.log('Agendamento realizado:', data);
  };

  const handleNewBooking = () => {
    setCurrentStep('profile');
    setBookingData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <MessageCircle className="w-8 h-8" />
          <div>
            <h1 className="text-xl font-bold">ZapAgenda</h1>
            <p className="text-sm opacity-90">Agendamento Fácil</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto bg-white min-h-[calc(100vh-80px)] shadow-xl">
        {currentStep === 'profile' && (
          <MerchantProfile onContinue={() => setCurrentStep('booking')} />
        )}
        
        {currentStep === 'booking' && (
          <BookingForm 
            onComplete={handleBookingComplete}
            onBack={() => setCurrentStep('profile')}
          />
        )}
        
        {currentStep === 'success' && (
          <div className="p-6 text-center space-y-6 fade-in">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-800">Agendamento Confirmado!</h2>
              <p className="text-gray-600">
                Seu agendamento foi realizado com sucesso.
              </p>
            </div>
            
            {bookingData && (
              <div className="bg-green-50 p-4 rounded-lg text-left space-y-2">
                <h3 className="font-semibold text-green-800">Detalhes do Agendamento:</h3>
                <p><strong>Nome:</strong> {bookingData.name}</p>
                <p><strong>WhatsApp:</strong> {bookingData.phone}</p>
                <p><strong>Serviço:</strong> {bookingData.service}</p>
                <p><strong>Data:</strong> {bookingData.date}</p>
                <p><strong>Horário:</strong> {bookingData.time}</p>
                {bookingData.notes && (
                  <p><strong>Observações:</strong> {bookingData.notes}</p>
                )}
              </div>
            )}
            
            <Button 
              onClick={handleNewBooking}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Fazer Novo Agendamento
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
