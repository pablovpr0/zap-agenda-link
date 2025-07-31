import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Calendar, MessageCircle, Sparkles, Copy, Check } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentData: {
    serviceName: string;
    date: string;
    time: string;
    clientName: string;
    companyName: string;
    companyPhone?: string;
  };
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  appointmentData
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShowAnimation(true), 100);
    } else {
      setShowAnimation(false);
    }
  }, [isOpen]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const generateCalendarEvent = () => {
    const startDate = new Date(`${appointmentData.date}T${appointmentData.time}:00`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    const formatDateForCalendar = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const eventDetails = {
      title: `${appointmentData.serviceName} - ${appointmentData.companyName}`,
      start: formatDateForCalendar(startDate),
      end: formatDateForCalendar(endDate),
      description: `Agendamento confirmado com ${appointmentData.companyName}`
    };

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventDetails.title)}&dates=${eventDetails.start}/${eventDetails.end}&details=${encodeURIComponent(eventDetails.description)}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  const generateWhatsAppMessage = () => {
    const message = `Olá! Acabei de agendar um horário:

📅 *Serviço:* ${appointmentData.serviceName}
📅 *Data:* ${formatDate(appointmentData.date)}
⏰ *Horário:* ${appointmentData.time}
👤 *Nome:* ${appointmentData.clientName}

Agendamento confirmado! ✅`;

    const whatsappUrl = `https://wa.me/${appointmentData.companyPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const copyToClipboard = async () => {
    const text = `Agendamento confirmado!
Serviço: ${appointmentData.serviceName}
Data: ${formatDate(appointmentData.date)}
Horário: ${appointmentData.time}
Nome: ${appointmentData.clientName}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-white dark:bg-gray-900 border-0 shadow-2xl rounded-3xl overflow-hidden">
        <div className="relative p-6">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-500/10 rounded-full blur-xl animate-pulse" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-purple-500/10 rounded-full blur-lg animate-pulse" style={{ animationDelay: '2s' }} />
          </div>

          <div className="relative text-center space-y-6">
            {/* Success Icon with Animation */}
            <div className="flex justify-center">
              <div className={`relative transition-all duration-1000 ${showAnimation ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur-lg opacity-30 animate-pulse" />
                <div className="relative w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center shadow-2xl">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                <Sparkles className="inline-block mr-2 h-6 w-6 text-green-500" />
                Agendamento Confirmado!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Seu horário foi reservado com sucesso
              </p>
            </div>

            {/* Appointment Details */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200 dark:border-green-800">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Serviço:</span>
                  <span className="font-semibold text-green-700 dark:text-green-300">{appointmentData.serviceName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Data:</span>
                  <span className="font-semibold">{formatDate(appointmentData.date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Horário:</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-300">{appointmentData.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Nome:</span>
                  <span className="font-semibold">{appointmentData.clientName}</span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={generateCalendarEvent}
                  variant="outline"
                  className="flex items-center justify-center space-x-2 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all duration-300"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Calendário</span>
                </Button>
                
                {appointmentData.companyPhone && (
                  <Button
                    onClick={generateWhatsAppMessage}
                    variant="outline"
                    className="flex items-center justify-center space-x-2 hover:bg-green-50 dark:hover:bg-green-950 transition-all duration-300"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm">WhatsApp</span>
                  </Button>
                )}
              </div>

              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="w-full flex items-center justify-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                <span className="text-sm">{copied ? 'Copiado!' : 'Copiar detalhes'}</span>
              </Button>

              <Button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Fechar
              </Button>
            </div>

            {/* Footer Message */}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Você receberá uma confirmação em breve
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessModal;