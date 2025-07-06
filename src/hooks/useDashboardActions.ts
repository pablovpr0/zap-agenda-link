
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useDashboardActions = (bookingLink: string) => {
  const { toast } = useToast();
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!bookingLink) return;

    try {
      await navigator.clipboard.writeText(bookingLink);
      setLinkCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
      setTimeout(() => setLinkCopied(false), 3000);
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

    const message = `Olá! Você pode agendar seus horários diretamente pelo link: ${bookingLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return {
    linkCopied,
    handleCopyLink,
    handleViewPublicPage,
    handleShareWhatsApp
  };
};
