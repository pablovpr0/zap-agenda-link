
import { useParams } from 'react-router-dom';
import { usePublicBooking } from '@/hooks/usePublicBooking';
import { usePublicThemeApplication } from '@/hooks/usePublicThemeApplication';
import LoadingState from '@/components/public-booking/LoadingState';
import ErrorState from '@/components/public-booking/ErrorState';
import ModernPublicBooking from '@/components/public-booking/ModernPublicBooking';

const PublicBooking = () => {
  const { companySlug } = useParams<{ companySlug: string }>();

  const {
    companyData,
    companySettings,
    profile,
    services,
    loading,
    error
  } = usePublicBooking(companySlug || '');

  // Aplicar tema personalizado APENAS na área pública
  usePublicThemeApplication(companySlug);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !companyData || !companySettings || !profile) {
    return <ErrorState companySlug={companySlug} />;
  }

  return <ModernPublicBooking />;
};

export default PublicBooking;
