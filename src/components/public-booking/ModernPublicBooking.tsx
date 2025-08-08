import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicBooking } from '@/hooks/usePublicBooking';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CompanyHeader } from '@/components/public-booking/CompanyHeader';
import { CompanyProfileSection } from '@/components/public-booking/CompanyProfileSection';
import BookingDataCard from '@/components/public-booking/BookingDataCard';
import { SuccessModal } from '@/components/public-booking/SuccessModal';
import { Service } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';

interface ModernPublicBookingProps {
  companySlug: string;
}

interface BookingFormData {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  selectedService: string;
  selectedProfessional?: string;
  selectedDate: string;
  selectedTime: string;
}

const ModernPublicBooking: React.FC<ModernPublicBookingProps> = ({ companySlug }) => {
  const {
    companyData,
    companySettings,
    profile,
    services,
    professionals,
    loading,
    error,
    submitting,
    availableDates,
    generateAvailableTimes,
    submitBooking
  } = usePublicBooking(companySlug);

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [timesLoading, setTimesLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<any>(null);
  const [formData, setFormData] = useState<BookingFormData>({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    selectedService: '',
    selectedProfessional: '',
    selectedDate: selectedDate,
    selectedTime: ''
  });

  useEffect(() => {
    setFormData(prev => ({ ...prev, selectedDate: selectedDate }));
  }, [selectedDate]);

  useEffect(() => {
    const loadAvailableTimes = async () => {
      if (companySettings && selectedDate) {
        setTimesLoading(true);
        try {
          const times = await generateAvailableTimes(selectedDate);
          setAvailableTimes(times);
        } catch (error) {
          console.error('Error generating available times:', error);
        } finally {
          setTimesLoading(false);
        }
      }
    };

    loadAvailableTimes();
  }, [companySettings, selectedDate, generateAvailableTimes]);

  const handleSubmit = async () => {
    const isSuccess = await submitBooking({
      ...formData,
      selectedDate: selectedDate,
      selectedTime: selectedTime
    }, refreshAvailableTimes);

    if (isSuccess) {
      // Reset form data after successful submission
      setFormData({
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        selectedService: '',
        selectedProfessional: '',
        selectedDate: selectedDate,
        selectedTime: ''
      });
      setSelectedTime('');
    }
  };

  const refreshAvailableTimes = async () => {
    if (companySettings && selectedDate) {
      setTimesLoading(true);
      try {
        const times = await generateAvailableTimes(selectedDate);
        setAvailableTimes(times);
      } catch (error) {
        console.error('Error refreshing available times:', error);
      } finally {
        setTimesLoading(false);
      }
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessModalData(null);
  };

  const EnhancedCompanyHeader = ({ companyData }: { companyData: any }) => {
    return (
      <CompanyHeader
        companyName={companyData?.company_name}
        companyLogo={companyData?.logo_url}
        welcomeMessage={companyData?.welcome_message}
        instagramUrl={companyData?.instagram_url}
      />
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Company Header */}
        <div className="relative">
          {/* Cover Image */}
          {companyData?.cover_image_url && (
            <div className="w-full h-32 sm:h-48 md:h-64 relative overflow-hidden">
              <img
                src={companyData.cover_image_url}
                alt="Cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
          )}

          {/* Company Profile */}
          <EnhancedCompanyHeader companyData={companyData} />
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Company Info */}
            <div className="lg:w-1/3 space-y-6">
              <CompanyProfileSection profile={profile} />
            </div>

            {/* Right Column - Booking Form */}
            <div className="lg:w-2/3">
              <BookingDataCard
                services={services}
                availableDates={availableDates}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                selectedTime={selectedTime}
                onTimeSelect={setSelectedTime}
                availableTimes={availableTimes}
                timesLoading={timesLoading}
                onSubmit={handleSubmit}
                submitting={submitting}
                formData={formData}
                onFormDataChange={setFormData}
                companyData={companyData}
                professionals={professionals}
                onRefreshTimes={refreshAvailableTimes}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={closeSuccessModal}
        appointmentData={successModalData}
      />
    </>
  );
};

export default ModernPublicBooking;
