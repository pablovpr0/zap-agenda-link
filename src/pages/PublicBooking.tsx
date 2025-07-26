
import { useParams } from 'react-router-dom';
import { usePublicBooking } from '@/hooks/usePublicBooking';
import LoadingState from '@/components/public-booking/LoadingState';
import ErrorState from '@/components/public-booking/ErrorState';
import EnhancedCompanyHeader from '@/components/public-booking/EnhancedCompanyHeader';
import BookingInfoSection from '@/components/public-booking/BookingInfoSection';
import BookingForm from '@/components/public-booking/BookingForm';
import PublicBookingFooter from '@/components/public-booking/PublicBookingFooter';

const PublicBooking = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  
  console.log('🌐 PublicBooking: Slug capturado da URL:', companySlug);
  console.log('🌐 PublicBooking: window.location.pathname:', window.location.pathname);

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

  if (loading) {
    return <LoadingState />;
  }

  if (!companySettings || !profile) {
    console.error('Empresa não encontrada para slug:', companySlug);
    return <ErrorState companySlug={companySlug} />;
  }

  const availableDates = generateAvailableDates();

  const handleFormSubmit = async (formData: {
    selectedService: string;
    selectedDate: string;
    selectedTime: string;
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    notes: string;
  }) => {
    return await submitBooking(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header da empresa */}
        <EnhancedCompanyHeader 
          companySettings={companySettings}
          profile={profile}
        />

        {/* Seção informativa sobre agendamento */}
        <BookingInfoSection />

        {/* Formulário de agendamento */}
        <BookingForm
          services={services}
          availableDates={availableDates}
          submitting={submitting}
          onSubmit={handleFormSubmit}
          generateAvailableTimes={generateAvailableTimes}
        />

        {/* Footer */}
        <PublicBookingFooter companySettings={companySettings} />
      </div>
    </div>
  );
};

export default PublicBooking;
