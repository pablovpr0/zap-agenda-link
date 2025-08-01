
import { useParams } from 'react-router-dom';
import { usePublicBooking } from '@/hooks/usePublicBooking';
import { usePublicTheme } from '@/hooks/usePublicTheme';
import LoadingState from '@/components/public-booking/LoadingState';
import ErrorState from '@/components/public-booking/ErrorState';
import ModernPublicBooking from '@/components/public-booking/ModernPublicBooking';

const PublicBooking = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  
  console.log('🌐 PublicBooking: Slug capturado da URL:', companySlug);
  console.log('🌐 PublicBooking: window.location.pathname:', window.location.pathname);
  console.log('🌐 PublicBooking: window.location.href:', window.location.href);
  console.log('🌐 PublicBooking: useParams result:', { companySlug });

  const {
    companyData,
    companySettings,
    profile,
    services,
    loading,
    error
  } = usePublicBooking(companySlug || '');

  // Aplicar tema da empresa na página pública
  usePublicTheme(companySettings);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !companyData || !companySettings || !profile) {
    console.error('❌ PublicBooking: Empresa não encontrada para slug:', companySlug);
    console.error('❌ PublicBooking: error:', error);
    console.error('❌ PublicBooking: companyData:', companyData);
    console.error('❌ PublicBooking: companySettings:', companySettings);
    console.error('❌ PublicBooking: profile:', profile);
    return <ErrorState companySlug={companySlug} />;
  }

  return <ModernPublicBooking />;
};

export default PublicBooking;
