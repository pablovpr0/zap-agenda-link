import { useEffect } from 'react';
import { CompanySettings } from '@/types/publicBooking';
import { themes, getThemeById, applyTheme, Theme } from '@/utils/themes';

export const usePublicTheme = (companySettings: CompanySettings | null) => {
  useEffect(() => {
    if (!companySettings) return;

    // Aplicar tema baseado no tema selecionado ou cor da empresa
    const selectedThemeId = (companySettings as any).selected_theme_id;
    const themeColor = companySettings.theme_color || '#25d366';
    
    console.log('🎨 Aplicando tema público para empresa:', {
      slug: companySettings.slug,
      selectedThemeId,
      themeColor
    });

    let selectedTheme: Theme | null = null;
    
    // Primeiro, tentar usar o tema selecionado pelo ID
    if (selectedThemeId) {
      selectedTheme = getThemeById(selectedThemeId);
      console.log('🎨 Tema encontrado por ID:', selectedTheme?.name);
    }
    
    // Se não encontrou por ID, procurar por cor similar
    if (!selectedTheme) {
      for (const theme of themes) {
        if (theme.colors.primary.toLowerCase() === themeColor.toLowerCase()) {
          selectedTheme = theme;
          console.log('🎨 Tema encontrado por cor:', selectedTheme.name);
          break;
        }
      }
    }

    // Se ainda não encontrou, criar um tema customizado
    if (!selectedTheme) {
      selectedTheme = createCustomTheme(themeColor, companySettings.slug);
      console.log('🎨 Tema customizado criado:', selectedTheme.name);
    }

    // Aplicar o tema na página pública
    applyPublicTheme(selectedTheme, companySettings);

  }, [companySettings]);
};

const createCustomTheme = (primaryColor: string, companySlug: string): Theme => {
  // Gerar cores complementares baseadas na cor primária
  const secondary = adjustBrightness(primaryColor, -20);
  const accent = adjustBrightness(primaryColor, 20);
  const background = adjustBrightness(primaryColor, 95);
  
  return {
    id: `custom-${companySlug}`,
    name: 'Tema Personalizado',
    category: 'masculine',
    colors: {
      primary: primaryColor,
      secondary: secondary,
      accent: accent,
      background: background,
      gradient: `linear-gradient(135deg, ${primaryColor} 0%, ${secondary} 100%)`
    },
    description: 'Tema personalizado da empresa'
  };
};

const adjustBrightness = (color: string, percent: number): string => {
  // Converter hex para RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Ajustar brilho
  const newR = Math.min(255, Math.max(0, r + (r * percent / 100)));
  const newG = Math.min(255, Math.max(0, g + (g * percent / 100)));
  const newB = Math.min(255, Math.max(0, b + (b * percent / 100)));

  // Converter de volta para hex
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};

const applyPublicTheme = (theme: Theme, companySettings: CompanySettings) => {
  const root = document.documentElement;
  
  // Aplicar variáveis CSS para a página pública
  root.style.setProperty('--public-theme-primary', theme.colors.primary);
  root.style.setProperty('--public-theme-secondary', theme.colors.secondary);
  root.style.setProperty('--public-theme-accent', theme.colors.accent);
  root.style.setProperty('--public-theme-background', theme.colors.background);
  root.style.setProperty('--public-theme-gradient', theme.colors.gradient);
  
  // Aplicar também nas variáveis globais para compatibilidade
  root.style.setProperty('--theme-primary', theme.colors.primary);
  root.style.setProperty('--theme-secondary', theme.colors.secondary);
  root.style.setProperty('--theme-accent', theme.colors.accent);
  root.style.setProperty('--theme-background', theme.colors.background);
  root.style.setProperty('--theme-gradient', theme.colors.gradient);
  
  console.log('✅ Tema público aplicado:', {
    theme: theme.name,
    colors: theme.colors
  });
};