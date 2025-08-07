import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Palette, Monitor, Moon, Sun, Eye, Save, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { savePublicThemeSettings, loadPublicThemeSettings } from '@/services/publicThemeService';

// Cores disponíveis (sistema original + 16 novas cores)
const THEME_COLORS = [{
  id: 'green',
  name: 'Verde Principal',
  primary: '#19c662'
}, {
  id: 'blue',
  name: 'Azul Corporativo',
  primary: '#1e88e5'
}, {
  id: 'purple',
  name: 'Roxo Elegante',
  primary: '#8e24aa'
}, {
  id: 'orange',
  name: 'Laranja Vibrante',
  primary: '#f57c00'
}, {
  id: 'red',
  name: 'Vermelho Profissional',
  primary: '#d32f2f'
}, {
  id: 'gray',
  name: 'Cinza Moderno',
  primary: '#616161'
},
// 6 cores anteriores
{
  id: 'teal',
  name: 'Verde Água',
  primary: '#0d9488'
}, {
  id: 'indigo',
  name: 'Índigo Profundo',
  primary: '#4f46e5'
}, {
  id: 'pink',
  name: 'Rosa Elegante',
  primary: '#ec4899'
}, {
  id: 'emerald',
  name: 'Esmeralda',
  primary: '#059669'
}, {
  id: 'amber',
  name: 'Âmbar Dourado',
  primary: '#f59e0b'
}, {
  id: 'slate',
  name: 'Ardósia Moderna',
  primary: '#475569'
},
// 10 novas cores
{
  id: 'brown',
  name: 'Marrom Café',
  primary: '#8C6651'
}, {
  id: 'tan',
  name: 'Bege Elegante',
  primary: '#B88E66'
}, {
  id: 'cream',
  name: 'Creme Suave',
  primary: '#DEBBA5'
}, {
  id: 'sand',
  name: 'Areia Dourada',
  primary: '#D3B88B'
}, {
  id: 'blush',
  name: 'Rosa Claro',
  primary: '#F5CCC6'
}, {
  id: 'silver',
  name: 'Prata Moderna',
  primary: '#B2B1B6'
}, {
  id: 'lime',
  name: 'Lima Vibrante',
  primary: '#F7F78F'
}, {
  id: 'gold',
  name: 'Ouro Brilhante',
  primary: '#F9DB5C'
}, {
  id: 'bronze',
  name: 'Bronze Antigo',
  primary: '#A87B05'
}, {
  id: 'chocolate',
  name: 'Chocolate Escuro',
  primary: '#664300'
}];
interface PublicThemeCustomizerProps {
  onSave?: (settings: any) => void;
}
const PublicThemeCustomizer = ({
  onSave
}: PublicThemeCustomizerProps) => {
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const [selectedColorId, setSelectedColorId] = useState('green');
  const [darkMode, setDarkMode] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carregar configurações existentes
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const settings = await loadPublicThemeSettings(user.id);
        if (settings) {
          setSelectedColorId(settings.theme_color);
          setDarkMode(settings.dark_mode);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [user?.id]);
  const handleColorSelect = (colorId: string) => {
    setSelectedColorId(colorId);
    toast({
      title: "Cor selecionada",
      description: `Tema ${THEME_COLORS.find(c => c.id === colorId)?.name} selecionado`
    });
  };
  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled);
    toast({
      title: "Modo alterado",
      description: enabled ? "Modo escuro ativado" : "Modo claro ativado"
    });
  };
  const togglePreview = () => {
    const newPreviewMode = !isPreviewMode;
    setIsPreviewMode(newPreviewMode);
    if (newPreviewMode) {
      // Aplicar tema temporariamente para preview
      const {
        applyPublicTheme
      } = require('@/types/publicTheme');
      applyPublicTheme(selectedColorId, darkMode);
      document.body.classList.add('public-area');
      document.body.classList.remove('admin-area');
    } else {
      // Restaurar tema administrativo
      document.body.classList.remove('public-area');
      document.body.classList.add('admin-area');

      // Limpar variáveis de tema público
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
      document.body.classList.remove('dark-mode');
    }
    toast({
      title: newPreviewMode ? "Preview ativado" : "Preview desativado",
      description: newPreviewMode ? "Visualizando mudanças" : "Tema restaurado"
    });
  };
  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const settings = {
        company_id: user.id,
        theme_color: selectedColorId,
        dark_mode: darkMode
      };

      // Salvar no banco de dados
      await savePublicThemeSettings(settings);

      // Callback opcional
      if (onSave) {
        onSave(settings);
      }
      toast({
        title: "✅ Configurações salvas!",
        description: "Tema da área pública atualizado com sucesso. Seus clientes verão as mudanças imediatamente."
      });
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
      toast({
        title: "❌ Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const selectedColor = THEME_COLORS.find(c => c.id === selectedColorId);
  if (loading) {
    return <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2">Carregando configurações...</span>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Personalização da Área Pública
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configure como seus clientes visualizarão a página de agendamento
        </p>
        
        {/* Aviso importante */}
        
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Seletor de Cores */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Cor do Tema</Label>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {THEME_COLORS.map(color => <Card key={color.id} className={`cursor-pointer transition-all hover:shadow-md ${selectedColorId === color.id ? 'ring-2 ring-blue-500 shadow-md' : 'hover:ring-1 hover:ring-gray-300'}`} onClick={() => handleColorSelect(color.id)}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex-shrink-0" style={{
                  backgroundColor: color.primary
                }} />
                    
                  </div>
                </CardContent>
              </Card>)}
          </div>
        </div>

        {/* Toggle Dark/Light Mode */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Modo de Visualização</Label>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-5 h-5 text-gray-600" /> : <Sun className="w-5 h-5 text-yellow-500" />}
              <div>
                <p className="font-medium text-sm">
                  {darkMode ? 'Modo Escuro' : 'Modo Claro'}
                </p>
                <p className="text-xs text-gray-600">
                  {darkMode ? 'Fundo escuro com texto claro' : 'Fundo claro com texto escuro'}
                </p>
              </div>
            </div>
            <Switch checked={darkMode} onCheckedChange={handleDarkModeToggle} />
          </div>
        </div>

        {/* Preview da Área Pública */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Preview da Área Pública</Label>
          <div className="border rounded-lg p-4 space-y-4" style={{
          backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
          color: darkMode ? '#ffffff' : '#1f2937'
        }}>
            {/* Header simulado */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full mx-auto" style={{
              backgroundColor: selectedColor?.primary
            }} />
              <h3 className="font-semibold">Sua Empresa</h3>
              <p className="text-sm opacity-75">Agende seu horário</p>
            </div>
            
            {/* Botão simulado */}
            <Button className="w-full" style={{
            backgroundColor: selectedColor?.primary,
            borderColor: selectedColor?.primary
          }}>
              Agendar Horário
            </Button>
            
            {/* Cards simulados */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded border" style={{
              backgroundColor: darkMode ? '#2d2d2d' : '#f8f9fa',
              borderColor: darkMode ? '#404040' : '#e5e7eb'
            }}>
                <p className="text-xs font-medium">Serviço 1</p>
                <p className="text-xs opacity-75">R$ 50,00</p>
              </div>
              <div className="p-3 rounded border" style={{
              backgroundColor: darkMode ? '#2d2d2d' : '#f8f9fa',
              borderColor: darkMode ? '#404040' : '#e5e7eb'
            }}>
                <p className="text-xs font-medium">Serviço 2</p>
                <p className="text-xs opacity-75">R$ 80,00</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={togglePreview} className="flex-1">
            <Eye className="w-4 h-4 mr-2" />
            {isPreviewMode ? 'Desativar Preview' : 'Ativar Preview'}
          </Button>
          
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>

        {/* Informações adicionais */}
        
      </CardContent>
    </Card>;
};
export default PublicThemeCustomizer;