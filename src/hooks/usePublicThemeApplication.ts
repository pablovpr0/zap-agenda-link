import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { applyPublicTheme } from '@/types/publicTheme';
import { loadPublicThemeBySlug } from '@/services/publicThemeService';

/**
 * Hook para aplicar tema APENAS na área pública
 * Detecta se está na área pública e aplica o tema personalizado
 */
export const usePublicThemeApplication = (companySlug?: string) => {
  const location = useLocation();
  
  // Detectar se está na área pública
  const isPublicArea = location.pathname.startsWith('/public/') || 
                       (location.pathname !== '/' && 
                        location.pathname !== '/auth' && 
                        location.pathname !== '/company-setup' && 
                        !location.pathname.startsWith('/create-test') &&
                        !location.pathname.startsWith('/debug') &&
                        !location.pathname.startsWith('/timezone-test') &&
                        !location.pathname.startsWith('/theme-test') &&
                        !location.pathname.startsWith('/fix-') &&
                        location.pathname.length > 1); // Evitar paths vazios

  useEffect(() => {
    const applyThemeIfPublic = async () => {
      // Só aplicar tema se estiver na área pública
      if (!isPublicArea || !companySlug) {
        console.log('🎨 Not in public area or no slug, skipping theme application');
        return;
      }

      try {
        console.log('🎨 Loading public theme for company:', companySlug);
        
        // Carregar configurações de tema da empresa
        const themeSettings = await loadPublicThemeBySlug(companySlug);
        
        if (themeSettings) {
          console.log('🎨 Applying custom theme:', themeSettings);
          applyPublicTheme(themeSettings.theme_color, themeSettings.dark_mode);
          
          // Adicionar classe para identificar área pública
          document.body.classList.add('public-area');
          document.body.classList.remove('admin-area');
        } else {
          console.log('🎨 No custom theme found, applying default');
          // Aplicar tema padrão para área pública
          applyPublicTheme('green', false);
          document.body.classList.add('public-area');
          document.body.classList.remove('admin-area');
        }
      } catch (error) {
        console.error('❌ Error loading public theme:', error);
        // Em caso de erro, aplicar tema padrão
        applyPublicTheme('green', false);
        document.body.classList.add('public-area');
        document.body.classList.remove('admin-area');
      }
    };

    // Cleanup: remover tema público se não estiver na área pública
    const cleanupTheme = () => {
      if (!isPublicArea) {
        console.log('🎨 Not in public area, removing public theme');
        document.body.classList.remove('public-area');
        document.body.classList.add('admin-area');
        
        // Restaurar variáveis CSS padrão para área administrativa
        const root = document.documentElement;
        root.style.removeProperty('--public-theme-primary');
        root.style.removeProperty('--public-theme-secondary');
        root.style.removeProperty('--public-theme-accent');
        root.style.removeProperty('--public-theme-background');
        root.style.removeProperty('--public-theme-surface');
        root.style.removeProperty('--public-theme-text');
        root.style.removeProperty('--public-theme-text-secondary');
        root.style.removeProperty('--public-theme-border');
        root.style.removeProperty('--public-theme-gradient');
        root.classList.remove('dark-mode');
      }
    };

    if (isPublicArea) {
      applyThemeIfPublic();
    } else {
      cleanupTheme();
    }

    // Cleanup ao desmontar
    return () => {
      if (isPublicArea) {
        cleanupTheme();
      }
    };
  }, [isPublicArea, companySlug]);

  return {
    isPublicArea,
    companySlug
  };
};