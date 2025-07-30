
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { fetchCompanySettings } from '@/services/companySettingsService';
import { generatePublicBookingUrl } from '@/lib/domainConfig';

export const useDashboardData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [bookingLink, setBookingLink] = useState<string>('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const settings = await fetchCompanySettings(user.id);
        setCompanySettings(settings);
        
        if (settings?.slug) {
          const publicUrl = generatePublicBookingUrl(settings.slug);
          setBookingLink(publicUrl);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const handleCopyLink = async () => {
    if (!bookingLink) return;
    
    try {
      await navigator.clipboard.writeText(bookingLink);
      setLinkCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  const handleViewPublicPage = () => {
    if (bookingLink) {
      window.open(bookingLink, '_blank');
    }
  };

  const handleShareWhatsApp = () => {
    if (!bookingLink) return;
    
    const message = `Olá! Você pode agendar um horário comigo através deste link: ${bookingLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return {
    companySettings,
    bookingLink,
    linkCopied,
    loading,
    handleCopyLink,
    handleViewPublicPage,
    handleShareWhatsApp
  };
};
