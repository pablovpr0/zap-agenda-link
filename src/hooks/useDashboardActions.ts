
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { devLog, devError } from '@/utils/console';

export const useDashboardActions = (bookingLink: string) => {
  const [linkCopied, setLinkCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingLink);
      setLinkCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link de agendamento foi copiado para a área de transferência.",
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      devError('Erro ao copiar link:', error);
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  const handleViewPublicPage = () => {
    devLog('Abrindo página pública:', bookingLink);
    window.open(bookingLink, '_blank');
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(`Agende seu horário: ${bookingLink}`);
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return {
    linkCopied,
    handleCopyLink,
    handleViewPublicPage,
    handleShareWhatsApp
  };
};
