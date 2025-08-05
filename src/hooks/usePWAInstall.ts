
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const location = useLocation();

  // Determina se é área do cliente (URL pública) ou comerciante
  const isClientArea = location.pathname.startsWith('/public/') || 
                       (location.pathname !== '/' && 
                        location.pathname !== '/auth' && 
                        location.pathname !== '/company-setup' && 
                        !location.pathname.startsWith('/create-test') &&
                        !location.pathname.startsWith('/debug') &&
                        !location.pathname.startsWith('/fix-'));
  
  const appName = isClientArea ? 'ZapAgenda Cliente' : 'ZapAgenda Comércio';
  const installMessage = isClientArea 
    ? 'Instale o ZapAgenda Cliente para agendar mais facilmente!' 
    : 'Instale o ZapAgenda Comércio para gerenciar seus agendamentos!';

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Só mostrar o pop-up se NÃO for área do cliente (página pública)
      setShowInstallPrompt(!isClientArea);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
  };

  return {
    showInstallPrompt,
    installPWA,
    dismissInstallPrompt,
    appName,
    installMessage,
    canInstall: !!deferredPrompt
  };
};
