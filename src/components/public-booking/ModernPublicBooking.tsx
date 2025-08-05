import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicBooking } from '@/hooks/usePublicBooking';

import { useToast } from '@/hooks/use-toast';
import LoadingState from '@/components/public-booking/LoadingState';
import ErrorState from '@/components/public-booking/ErrorState';
import CompanyProfileSection from '@/components/public-booking/CompanyProfileSection';
import CompanyHeaderWithCover from '@/components/public-booking/CompanyHeaderWithCover';
import ScheduleHeroCard from '@/components/public-booking/ScheduleHeroCard';
import BookingDataCard from '@/components/public-booking/BookingDataCard';
import ClientDataCard from '@/components/public-booking/ClientDataCard';

const ModernPublicBooking = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  const { toast } = useToast();
  
  const {
    companyData,
    companySettings,
    profile,
    services,
    loading,
    error,
    submitting,
    generateAvailableDates,
    generateAvailableTimes,
    submitBooking
  } = usePublicBooking(companySlug || '');

  // Tema é aplicado automaticamente pelo hook usePublicThemeApplication na página pai

  // Estados do formulário
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);

  // Gerar datas disponíveis
  const availableDates = generateAvailableDates();

  // Carregar horários quando data e serviço são selecionados
  useEffect(() => {
    const loadTimes = async () => {
      if (selectedDate && selectedService) {
        console.log('📅 Data selecionada:', selectedDate, '- Carregando horários...');
        console.log('🏢 Company data:', { companyId: companyData?.id, companySlug });
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
          
          // Carregamento otimizado dos horários
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

    // Usar timeout mínimo para garantir que a UI seja atualizada imediatamente
    const timeoutId = setTimeout(loadTimes, 100);
    return () => clearTimeout(timeoutId);
  }, [selectedDate, selectedService, services, companyData?.id]);

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
      });

      if (success) {
        // Reset form
        setSelectedService('');
        setSelectedDate('');
        setSelectedTime('');
        setAvailableTimes([]);
      }
    } catch (error) {
      console.error('Erro no agendamento:', error);
    }
  };

  const refreshTimes = async () => {
    if (selectedDate && selectedService) {
      setIsLoadingTimes(true);
      try {
        const selectedServiceData = services.find(s => s.id === selectedService);
        const serviceDuration = selectedServiceData?.duration || 30;
        const times = await generateAvailableTimes(selectedDate, serviceDuration);
        setAvailableTimes(times);
        
        // Se o horário selecionado não está mais disponível, limpar seleção
        if (selectedTime && !times.includes(selectedTime)) {
          setSelectedTime('');
          toast({
            title: "Horário atualizado",
            description: "O horário selecionado não está mais disponível. Selecione outro horário.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Erro ao atualizar horários:', error);
        toast({
          title: "Erro ao atualizar",
          description: "Não foi possível atualizar os horários. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTimes(false);
      }
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
        canEditCover={false} // Área pública não permite edição
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

      {/* Espaçamento inferior */}
      <div className="h-8" />
    </div>
  );
};

export default ModernPublicBooking;
