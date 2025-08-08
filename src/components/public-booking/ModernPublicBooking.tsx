
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicBooking } from '@/hooks/usePublicBooking';
import { useToast } from '@/hooks/use-toast';
import LoadingState from '@/components/public-booking/LoadingState';
import ErrorState from '@/components/public-booking/ErrorState';
import CompanyHeaderWithCover from '@/components/public-booking/CompanyHeaderWithCover';
import ScheduleHeroCard from '@/components/public-booking/ScheduleHeroCard';
import BookingDataCard from '@/components/public-booking/BookingDataCard';
import ClientDataCard from '@/components/public-booking/ClientDataCard';
import SuccessModal from '@/components/public-booking/SuccessModal';

const ModernPublicBooking = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  const { toast } = useToast();
  
  console.log('🔗 URL Slug extraído:', companySlug);
  
  const {
    companyData,
    companySettings,
    profile,
    services,
    loading,
    error,
    submitting,
    availableDates,
    generateAvailableTimes,
    submitBooking
  } = usePublicBooking(companySlug || '');

  // Estados do formulário
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<any>(null);

  // Carregar horários quando data e serviço são selecionados
  useEffect(() => {
    loadTimes();
  }, [selectedDate, selectedService, services, companyData?.id]);

  const loadTimes = async () => {
    if (selectedDate && selectedService) {
      console.log('📅 Data selecionada:', selectedDate, '- Carregando horários...');
      setIsLoadingTimes(true);
      setSelectedTime(''); // Reset time when loading new times
      
      try {
        const selectedServiceData = services.find(s => s.id === selectedService);
        const serviceDuration = selectedServiceData?.duration || 30;
        
        console.log('🔄 Carregando horários para:', { 
          selectedDate, 
          selectedService, 
          serviceDuration,
          companyId: companyData?.id,
          servicesCount: services.length
        });
        
        const times = await generateAvailableTimes(selectedDate, serviceDuration);
        setAvailableTimes(times);
        
        console.log('✅ Horários carregados:', times.length, 'horários disponíveis', times);
      } catch (error) {
        console.error('❌ Erro ao carregar horários:', error);
        setAvailableTimes([]);
        toast({
          title: "Erro ao carregar horários",
          description: "Não foi possível carregar os horários disponíveis. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTimes(false);
      }
    } else {
      console.log('⚠️ Condições não atendidas para carregar horários:', { selectedDate, selectedService });
      setAvailableTimes([]);
      setSelectedTime('');
    }
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !clientName.trim() || !clientPhone.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos para continuar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await submitBooking({
        selectedService,
        selectedDate,
        selectedTime,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: '',
        notes: ''
      }, loadTimes); // Pass refresh function

      if (success) {
        // Prepare success modal data
        const selectedServiceData = services.find(s => s.id === selectedService);
        const modalData = {
          serviceName: selectedServiceData?.name || 'Serviço',
          date: selectedDate,
          time: selectedTime,
          clientName: clientName.trim(),
          companyName: companySettings?.company_name || 'Empresa',
          companyPhone: companySettings?.phone
        };

        setSuccessModalData(modalData);
        setShowSuccessModal(true);

        // Reset form
        setSelectedService('');
        setSelectedDate('');
        setSelectedTime('');
        setClientName('');
        setClientPhone('');
        setAvailableTimes([]);

        // Send WhatsApp message after modal delay
        if (companySettings?.phone) {
          setTimeout(() => {
            const message = `Olá! Acabei de agendar um horário:

📅 *Serviço:* ${selectedServiceData?.name}
📅 *Data:* ${selectedDate}
⏰ *Horário:* ${selectedTime}
👤 *Nome:* ${clientName.trim()}

Agendamento confirmado! ✅`;

            const cleanPhone = companySettings.phone?.replace(/\D/g, '');
            const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Erro no agendamento:', error);
    }
  };

  const refreshTimes = async () => {
    await loadTimes();
    
    // Se o horário selecionado não está mais disponível, limpar seleção
    if (selectedTime && !availableTimes.includes(selectedTime)) {
      setSelectedTime('');
      toast({
        title: "Horário atualizado",
        description: "O horário selecionado não está mais disponível. Selecione outro horário.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error || !companyData || !companySettings || !profile) {
    return <ErrorState companySlug={companySlug} />;
  }

  return (
    <div className="min-h-screen public-page overflow-x-hidden">
      {/* Company Header with Cover */}
      <CompanyHeaderWithCover
        companyName={profile.company_name}
        businessType={profile.business_type}
        address={companyData.address}
        logoUrl={companySettings.logo_url || profile.company_logo}
        coverUrl={companyData.cover_image_url}
        canEditCover={false}
      />

      {/* Schedule Hero Card */}
      <ScheduleHeroCard />

      {/* Container with proper overflow handling */}
      <div className="relative">
        {/* Booking Data Card */}
        <BookingDataCard
          services={services}
          selectedService={selectedService}
          onServiceChange={setSelectedService}
          availableDates={availableDates}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          availableTimes={availableTimes}
          selectedTime={selectedTime}
          onTimeSelect={setSelectedTime}
          isLoadingTimes={isLoadingTimes}
          onRefreshTimes={refreshTimes}
        />

        {/* Client Data Card */}
        {selectedService && selectedDate && selectedTime && (
          <ClientDataCard
            clientName={clientName}
            onClientNameChange={setClientName}
            clientPhone={clientPhone}
            onClientPhoneChange={setClientPhone}
            onSubmit={handleSubmit}
            isSubmitting={submitting}
          />
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && successModalData && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          appointmentData={successModalData}
        />
      )}

      {/* Espaçamento inferior */}
      <div className="h-8" />
    </div>
  );
};

export default ModernPublicBooking;
