export interface PublicThemeColor {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}

export interface PublicThemeSettings {
  id?: string;
  company_id: string;
  theme_color: string;
  dark_mode: boolean;
  created_at?: string;
  updated_at?: string;
}

export const PUBLIC_THEME_COLORS: PublicThemeColor[] = [
  {
    id: 'green',
    name: 'Verde Principal',
    primary: '#19c662',
    secondary: '#16a34a',
    accent: '#22c55e'
  },
  {
    id: 'blue',
    name: 'Azul Corporativo',
    primary: '#1e88e5',
    secondary: '#1565c0',
    accent: '#42a5f5'
  },
  {
    id: 'purple',
    name: 'Roxo Elegante',
    primary: '#8e24aa',
    secondary: '#7b1fa2',
    accent: '#ab47bc'
  },
  {
    id: 'orange',
    name: 'Laranja Vibrante',
    primary: '#f57c00',
    secondary: '#ef6c00',
    accent: '#ff9800'
  },
  {
    id: 'red',
    name: 'Vermelho Profissional',
    primary: '#d32f2f',
    secondary: '#c62828',
    accent: '#f44336'
  },
  {
    id: 'gray',
    name: 'Cinza Moderno',
    primary: '#616161',
    secondary: '#424242',
    accent: '#757575'
  },
  // 6 cores anteriores
  {
    id: 'teal',
    name: 'Verde Água',
    primary: '#0d9488',
    secondary: '#0f766e',
    accent: '#14b8a6'
  },
  {
    id: 'indigo',
    name: 'Índigo Profundo',
    primary: '#4f46e5',
    secondary: '#4338ca',
    accent: '#6366f1'
  },
  {
    id: 'pink',
    name: 'Rosa Elegante',
    primary: '#ec4899',
    secondary: '#db2777',
    accent: '#f472b6'
  },
  {
    id: 'emerald',
    name: 'Esmeralda',
    primary: '#059669',
    secondary: '#047857',
    accent: '#10b981'
  },
  {
    id: 'amber',
    name: 'Âmbar Dourado',
    primary: '#f59e0b',
    secondary: '#d97706',
    accent: '#fbbf24'
  },
  {
    id: 'slate',
    name: 'Ardósia Moderna',
    primary: '#475569',
    secondary: '#334155',
    accent: '#64748b'
  },
  // 10 novas cores
  {
    id: 'brown',
    name: 'Marrom Café',
    primary: '#8C6651',
    secondary: '#7c5a47',
    accent: '#a0735d'
  },
  {
    id: 'tan',
    name: 'Bege Elegante',
    primary: '#B88E66',
    secondary: '#a67e56',
    accent: '#c99e76'
  },
  {
    id: 'cream',
    name: 'Creme Suave',
    primary: '#DEBBA5',
    secondary: '#d4b095',
    accent: '#e8c6b5'
  },
  {
    id: 'sand',
    name: 'Areia Dourada',
    primary: '#D3B88B',
    secondary: '#c9ae7b',
    accent: '#ddc29b'
  },
  {
    id: 'blush',
    name: 'Rosa Claro',
    primary: '#F5CCC6',
    secondary: '#f1c2b6',
    accent: '#f9d6d6'
  },
  {
    id: 'silver',
    name: 'Prata Moderna',
    primary: '#B2B1B6',
    secondary: '#a8a7a6',
    accent: '#bcbbc6'
  },
  {
    id: 'lime',
    name: 'Lima Vibrante',
    primary: '#F7F78F',
    secondary: '#f3f37f',
    accent: '#fbfb9f'
  },
  {
    id: 'gold',
    name: 'Ouro Brilhante',
    primary: '#F9DB5C',
    secondary: '#f5d74c',
    accent: '#fddf6c'
  },
  {
    id: 'bronze',
    name: 'Bronze Antigo',
    primary: '#A87B05',
    secondary: '#986f04',
    accent: '#b88706'
  },
  {
    id: 'chocolate',
    name: 'Chocolate Escuro',
    primary: '#664300',
    secondary: '#5c3d00',
    accent: '#704900'
  }
];

export const getPublicThemeColorById = (id: string): PublicThemeColor | undefined => {
  return PUBLIC_THEME_COLORS.find(color => color.id === id);
};

export const applyPublicTheme = (colorId: string, darkMode: boolean = false) => {
  console.log('🎨 Applying public theme:', { colorId, darkMode });
  
  const themeColor = getPublicThemeColorById(colorId);
  if (!themeColor) {
    console.error('❌ Theme color not found:', colorId);
    return;
  }

  const root = document.documentElement;
  
  // Aplicar cores do tema
  root.style.setProperty('--public-theme-primary', themeColor.primary);
  root.style.setProperty('--public-theme-secondary', themeColor.secondary);
  root.style.setProperty('--public-theme-accent', themeColor.accent);
  
  // Aplicar cores dinâmicas
  root.style.setProperty('--dynamic-primary', themeColor.primary);
  root.style.setProperty('--dynamic-secondary', themeColor.secondary);
  root.style.setProperty('--dynamic-accent', themeColor.accent);
  
  // Aplicar modo escuro/claro
  if (darkMode) {
    root.style.setProperty('--public-theme-background', '#1a1a1a');
    root.style.setProperty('--public-theme-surface', '#2d2d2d');
    root.style.setProperty('--public-theme-text', '#ffffff');
    root.style.setProperty('--public-theme-text-secondary', '#b3b3b3');
    root.style.setProperty('--public-theme-border', '#404040');
    document.body.classList.add('dark-mode');
  } else {
    root.style.setProperty('--public-theme-background', '#ffffff');
    root.style.setProperty('--public-theme-surface', '#f8f9fa');
    root.style.setProperty('--public-theme-text', '#1f2937');
    root.style.setProperty('--public-theme-text-secondary', '#6b7280');
    root.style.setProperty('--public-theme-border', '#e5e7eb');
    document.body.classList.remove('dark-mode');
  }
  
  // Criar gradiente baseado na cor primária
  const gradient = `linear-gradient(135deg, ${themeColor.primary} 0%, ${themeColor.secondary} 100%)`;
  root.style.setProperty('--public-theme-gradient', gradient);
  
  console.log('✅ Theme applied successfully:', {
    primary: themeColor.primary,
    secondary: themeColor.secondary,
    darkMode
  });
};