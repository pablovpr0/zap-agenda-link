
import { useCompanyData } from './useCompanyData';
import { useBookingSubmission } from './useBookingSubmission';
import { useAvailableTimes } from './useAvailableTimes';

export const usePublicBooking = (companySlug: string) => {
  const {
    companySettings,
    profile,
    services,
    professionals,
    loading
  } = useCompanyData(companySlug);

  const { submitBooking, submitting } = useBookingSubmission(
    companySettings,
    services,
    professionals
  );

  const { generateAvailableDates, generateAvailableTimes } = useAvailableTimes(companySettings);

  return {
    companySettings,
    profile,
    services,
    professionals,
    loading,
    submitting,
    generateAvailableDates,
    generateAvailableTimes,
    submitBooking
  };
};
