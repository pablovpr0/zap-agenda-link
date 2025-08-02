
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicBooking } from '@/hooks/usePublicBooking';
import { usePublicTheme } from '@/hooks/usePublicTheme';
import { useToast } from '@/hooks/use-toast';
import LoadingState from '@/components/public-booking/LoadingState';
import ErrorState from '@/components/public-booking/ErrorState';
import PublicHeader from '@/components/public-booking/PublicHeader';
import CompanyProfileSection from '@/components/public-booking/CompanyProfileSection';
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

  // Aplicar tema da empresa
  usePublicTheme(companySettings);

  // Estados do formulário
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);

  // Funções do menu
  const handleHistoryClick = () => {
    console.log('Histórico de agendamentos clicked');
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de histórico em desenvolvimento.",
    });
  };

  const handleNextAppointmentClick = () => {
    console.log('Próximo agendamento clicked');
    toast({
      title: "Em desenvolvimento", 
      description: "Funcionalidade de próximo agendamento em desenvolvimento.",
    });
  };

  const handleLogoutClick = () => {
    console.log('Logout clicked');
    // Limpar dados do formulário
    setSelectedService('');
    setSelectedDate('');
    setSelectedTime('');
    setClientName('');
    setClientPhone('');
    toast({
      title: "Sessão encerrada",
      description: "Você foi deslogado com sucesso.",
    });
  };

  // Gerar datas disponíveis
  const availableDates = generateAvailableDates();

  // Carregar horários quando data e serviço são selecionados
  useEffect(() => {
    const loadTimes = async () => {
      if (selectedDate && selectedService) {
        setIsLoadingTimes(true);
        try {
          // Get the selected service to pass its duration
          const selectedServiceData = services.find(s => s.id === selectedService);
          const serviceDuration = selectedServiceData?.duration || 30;
          const times = await generateAvailableTimes(selectedDate, serviceDuration);
          setAvailableTimes(times);
        } catch (error) {
          console.error('Erro ao carregar horários:', error);
          setAvailableTimes([]);
        } finally {
          setIsLoadingTimes(false);
        }
      } else {
        setAvailableTimes([]);
        setSelectedTime('');
      }
    };

    loadTimes();
  }, [selectedDate, selectedService, generateAvailableTimes, services]);

  // Reset time when date changes
  useEffect(() => {
    setSelectedTime('');
  }, [selectedDate]);

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
        toast({
          title: "Agendamento confirmado!",
          description: "Seu agendamento foi realizado com sucesso.",
        });

        // Reset form
        setSelectedService('');
        setSelectedDate('');
        setSelectedTime('');
        setClientName('');
        setClientPhone('');
      }
    } catch (error) {
      console.error('Erro no agendamento:', error);
    }
  };

  const refreshTimes = () => {
    if (selectedDate && selectedService) {
      const loadTimes = async () => {
        setIsLoadingTimes(true);
        try {
          const selectedServiceData = services.find(s => s.id === selectedService);
          const serviceDuration = selectedServiceData?.duration || 30;
          const times = await generateAvailableTimes(selectedDate, serviceDuration);
          setAvailableTimes(times);
        } catch (error) {
          console.error('Erro ao atualizar horários:', error);
        } finally {
          setIsLoadingTimes(false);
        }
      };
      loadTimes();
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error || !companyData || !companySettings || !profile) {
    return <ErrorState companySlug={companySlug} />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] overflow-x-hidden">
      {/* Header */}
      <PublicHeader 
        onHistoryClick={handleHistoryClick}
        onNextAppointmentClick={handleNextAppointmentClick}
        onLogoutClick={handleLogoutClick}
      />

      {/* Company Profile Section */}
      <CompanyProfileSection
        companyName={profile.company_name}
        businessType={profile.business_type}
        address={companyData.address}
        logoUrl={companySettings.logo_url || profile.company_logo}
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
