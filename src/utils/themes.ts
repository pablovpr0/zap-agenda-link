export interface Theme {
  id: string;
  name: string;
  category: 'masculine' | 'feminine';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    gradient: string;
  };
  description: string;
}

export const themes: Theme[] = [
  // TEMAS MASCULINOS (10)
  {
    id: 'dark-blue',
    name: 'Azul Profundo',
    category: 'masculine',
    colors: {
      primary: '#1e3a8a',
      secondary: '#3b82f6',
      accent: '#60a5fa',
      background: '#f8fafc',
      gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'
    },
    description: 'Elegante e profissional com tons de azul'
  },
  {
    id: 'steel-gray',
    name: 'Cinza Aço',
    category: 'masculine',
    colors: {
      primary: '#374151',
      secondary: '#6b7280',
      accent: '#9ca3af',
      background: '#f9fafb',
      gradient: 'linear-gradient(135deg, #374151 0%, #6b7280 100%)'
    },
    description: 'Moderno e sofisticado em tons de cinza'
  },
  {
    id: 'whatsapp-green',
    name: 'WhatsApp Verde',
    category: 'masculine',
    colors: {
      primary: '#19c662',
      secondary: '#128c7e',
      accent: '#34d399',
      background: '#f0fdf4',
      gradient: 'linear-gradient(135deg, #19c662 0%, #128c7e 100%)'
    },
    description: 'Tema oficial WhatsApp Business'
  },
  {
    id: 'forest-green',
    name: 'Verde Floresta',
    category: 'masculine',
    colors: {
      primary: '#065f46',
      secondary: '#059669',
      accent: '#10b981',
      background: '#f0fdf4',
      gradient: 'linear-gradient(135deg, #065f46 0%, #059669 100%)'
    },
    description: 'Natural e confiável com verde profundo'
  },
  {
    id: 'midnight-black',
    name: 'Preto Meia-Noite',
    category: 'masculine',
    colors: {
      primary: '#111827',
      secondary: '#374151',
      accent: '#6b7280',
      background: '#ffffff',
      gradient: 'linear-gradient(135deg, #111827 0%, #374151 100%)'
    },
    description: 'Elegante e minimalista em preto'
  },
  {
    id: 'navy-blue',
    name: 'Azul Marinho',
    category: 'masculine',
    colors: {
      primary: '#1e40af',
      secondary: '#2563eb',
      accent: '#3b82f6',
      background: '#f8fafc',
      gradient: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)'
    },
    description: 'Clássico e confiável azul marinho'
  },
  {
    id: 'bronze-copper',
    name: 'Bronze Cobre',
    category: 'masculine',
    colors: {
      primary: '#92400e',
      secondary: '#d97706',
      accent: '#f59e0b',
      background: '#fffbeb',
      gradient: 'linear-gradient(135deg, #92400e 0%, #d97706 100%)'
    },
    description: 'Robusto e terroso com tons de bronze'
  },
  {
    id: 'charcoal-slate',
    name: 'Carvão Ardósia',
    category: 'masculine',
    colors: {
      primary: '#0f172a',
      secondary: '#334155',
      accent: '#64748b',
      background: '#f8fafc',
      gradient: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)'
    },
    description: 'Forte e moderno em tons escuros'
  },
  {
    id: 'emerald-teal',
    name: 'Esmeralda Azul-Petróleo',
    category: 'masculine',
    colors: {
      primary: '#0d9488',
      secondary: '#14b8a6',
      accent: '#2dd4bf',
      background: '#f0fdfa',
      gradient: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)'
    },
    description: 'Sofisticado verde-azulado'
  },
  {
    id: 'burgundy-wine',
    name: 'Borgonha Vinho',
    category: 'masculine',
    colors: {
      primary: '#7c2d12',
      secondary: '#dc2626',
      accent: '#ef4444',
      background: '#fef2f2',
      gradient: 'linear-gradient(135deg, #7c2d12 0%, #dc2626 100%)'
    },
    description: 'Elegante e distintivo em tons de vinho'
  },
  {
    id: 'titanium-silver',
    name: 'Titânio Prata',
    category: 'masculine',
    colors: {
      primary: '#475569',
      secondary: '#64748b',
      accent: '#94a3b8',
      background: '#f1f5f9',
      gradient: 'linear-gradient(135deg, #475569 0%, #64748b 100%)'
    },
    description: 'Metálico e contemporâneo'
  },
  {
    id: 'natureza-profissional',
    name: 'Natureza Profissional',
    category: 'masculine',
    colors: {
      primary: '#19c662',
      secondary: '#16a34a',
      accent: '#22c55e',
      background: '#f0fdf4',
      gradient: 'linear-gradient(135deg, #19c662 0%, #16a34a 100%)'
    },
    description: 'Verde natural com toque profissional'
  },
  {
    id: 'verde-corporativo',
    name: 'Verde Corporativo',
    category: 'masculine',
    colors: {
      primary: '#19c662',
      secondary: '#15803d',
      accent: '#4ade80',
      background: '#f7fef7',
      gradient: 'linear-gradient(135deg, #19c662 0%, #15803d 100%)'
    },
    description: 'Verde elegante para ambiente corporativo'
  },
  {
    id: 'elegancia-verde',
    name: 'Elegância Verde',
    category: 'masculine',
    colors: {
      primary: '#19c662',
      secondary: '#166534',
      accent: '#34d399',
      background: '#ecfdf5',
      gradient: 'linear-gradient(135deg, #19c662 0%, #166534 100%)'
    },
    description: 'Verde sofisticado e elegante'
  },
  {
    id: 'verde-moderno',
    name: 'Verde Moderno',
    category: 'masculine',
    colors: {
      primary: '#19c662',
      secondary: '#10b981',
      accent: '#6ee7b7',
      background: '#f0fdfa',
      gradient: 'linear-gradient(135deg, #19c662 0%, #10b981 100%)'
    },
    description: 'Verde contemporâneo e moderno'
  },
  {
    id: 'verde-classico',
    name: 'Verde Clássico',
    category: 'masculine',
    colors: {
      primary: '#19c662',
      secondary: '#059669',
      accent: '#2dd4bf',
      background: '#f0fdf4',
      gradient: 'linear-gradient(135deg, #19c662 0%, #059669 100%)'
    },
    description: 'Verde tradicional e atemporal'
  },

  // TEMAS FEMININOS (10)
  {
    id: 'rose-gold',
    name: 'Ouro Rosa',
    category: 'feminine',
    colors: {
      primary: '#be185d',
      secondary: '#ec4899',
      accent: '#f472b6',
      background: '#fdf2f8',
      gradient: 'linear-gradient(135deg, #be185d 0%, #ec4899 100%)'
    },
    description: 'Delicado e luxuoso ouro rosa'
  },
  {
    id: 'lavender-purple',
    name: 'Lavanda Roxo',
    category: 'feminine',
    colors: {
      primary: '#7c3aed',
      secondary: '#8b5cf6',
      accent: '#a78bfa',
      background: '#faf5ff',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)'
    },
    description: 'Suave e relaxante lavanda'
  },
  {
    id: 'coral-pink',
    name: 'Coral Rosa',
    category: 'feminine',
    colors: {
      primary: '#dc2626',
      secondary: '#f87171',
      accent: '#fca5a5',
      background: '#fef2f2',
      gradient: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)'
    },
    description: 'Vibrante e caloroso coral'
  },
  {
    id: 'mint-green',
    name: 'Verde Menta',
    category: 'feminine',
    colors: {
      primary: '#059669',
      secondary: '#34d399',
      accent: '#6ee7b7',
      background: '#ecfdf5',
      gradient: 'linear-gradient(135deg, #059669 0%, #34d399 100%)'
    },
    description: 'Fresco e revitalizante menta'
  },
  {
    id: 'sunset-orange',
    name: 'Laranja Pôr do Sol',
    category: 'feminine',
    colors: {
      primary: '#ea580c',
      secondary: '#fb923c',
      accent: '#fdba74',
      background: '#fff7ed',
      gradient: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)'
    },
    description: 'Caloroso e energético laranja'
  },
  {
    id: 'blush-pink',
    name: 'Rosa Blush',
    category: 'feminine',
    colors: {
      primary: '#be123c',
      secondary: '#f43f5e',
      accent: '#fb7185',
      background: '#fff1f2',
      gradient: 'linear-gradient(135deg, #be123c 0%, #f43f5e 100%)'
    },
    description: 'Romântico e feminino rosa'
  },
  {
    id: 'sky-blue',
    name: 'Azul Céu',
    category: 'feminine',
    colors: {
      primary: '#0284c7',
      secondary: '#38bdf8',
      accent: '#7dd3fc',
      background: '#f0f9ff',
      gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)'
    },
    description: 'Sereno e inspirador azul céu'
  },
  {
    id: 'golden-yellow',
    name: 'Amarelo Dourado',
    category: 'feminine',
    colors: {
      primary: '#d97706',
      secondary: '#fbbf24',
      accent: '#fde047',
      background: '#fffbeb',
      gradient: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)'
    },
    description: 'Radiante e alegre dourado'
  },
  {
    id: 'plum-violet',
    name: 'Violeta Ameixa',
    category: 'feminine',
    colors: {
      primary: '#6b21a8',
      secondary: '#a855f7',
      accent: '#c084fc',
      background: '#faf5ff',
      gradient: 'linear-gradient(135deg, #6b21a8 0%, #a855f7 100%)'
    },
    description: 'Místico e elegante violeta'
  },
  {
    id: 'peach-cream',
    name: 'Pêssego Creme',
    category: 'feminine',
    colors: {
      primary: '#c2410c',
      secondary: '#fb923c',
      accent: '#fed7aa',
      background: '#fff7ed',
      gradient: 'linear-gradient(135deg, #c2410c 0%, #fb923c 100%)'
    },
    description: 'Suave e acolhedor pêssego'
  }
];

export const getThemeById = (id: string): Theme | undefined => {
  return themes.find(theme => theme.id === id);
};

export const getThemesByCategory = (category: 'masculine' | 'feminine'): Theme[] => {
  return themes.filter(theme => theme.category === category);
};

export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  
  // Aplicar variáveis CSS customizadas
  root.style.setProperty('--theme-primary', theme.colors.primary);
  root.style.setProperty('--theme-secondary', theme.colors.secondary);
  root.style.setProperty('--theme-accent', theme.colors.accent);
  root.style.setProperty('--theme-background', theme.colors.background);
  root.style.setProperty('--theme-gradient', theme.colors.gradient);
  
  // Salvar tema no localStorage
  localStorage.setItem('zapagenda-theme', theme.id);
};

export const loadSavedTheme = (): Theme => {
  const savedThemeId = localStorage.getItem('zapagenda-theme');
  if (savedThemeId) {
    const theme = getThemeById(savedThemeId);
    if (theme) {
      return theme;
    }
  }
  
  // Retornar tema padrão (WhatsApp Green)
  return {
    id: 'whatsapp-green',
    name: 'WhatsApp Verde',
    category: 'masculine',
    colors: {
      primary: '#19c662',
      secondary: '#128c7e',
      accent: '#34d399',
      background: '#f0fdf4',
      gradient: 'linear-gradient(135deg, #19c662 0%, #128c7e 100%)'
    },
    description: 'Tema padrão WhatsApp'
  };
};