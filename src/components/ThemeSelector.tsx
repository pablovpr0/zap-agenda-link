import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Check } from 'lucide-react';
import { themes, Theme, applyTheme, loadSavedTheme } from '@/utils/themes';
import { useToast } from '@/hooks/use-toast';

interface ThemeSelectorProps {
  onThemeChange?: (theme: Theme) => void;
}

const ThemeSelector = ({ onThemeChange }: ThemeSelectorProps) => {
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState<Theme>(loadSavedTheme());

  const handleThemeSelect = (theme: Theme) => {
    setSelectedTheme(theme);
    applyTheme(theme);
    
    if (onThemeChange) {
      onThemeChange(theme);
    }

    toast({
      title: "Tema aplicado!",
      description: `Tema "${theme.name}" foi aplicado com sucesso.`,
    });
  };

  const ThemeCard = ({ theme }: { theme: Theme }) => (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedTheme.id === theme.id ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => handleThemeSelect(theme)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Preview do gradiente */}
          <div 
            className="h-16 rounded-lg"
            style={{ background: theme.colors.gradient }}
          />
          
          {/* Nome e categoria */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{theme.name}</h4>
              {selectedTheme.id === theme.id && (
                <Check className="w-4 h-4 text-green-600" />
              )}
            </div>
            
            <Badge 
              variant={theme.category === 'masculine' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {theme.category === 'masculine' ? 'Masculino' : 'Feminino'}
            </Badge>
          </div>
          
          {/* Descrição */}
          <p className="text-xs text-gray-600">{theme.description}</p>
          
          {/* Paleta de cores */}
          <div className="flex gap-1">
            <div 
              className="w-4 h-4 rounded-full border border-gray-200"
              style={{ backgroundColor: theme.colors.primary }}
              title="Cor primária"
            />
            <div 
              className="w-4 h-4 rounded-full border border-gray-200"
              style={{ backgroundColor: theme.colors.secondary }}
              title="Cor secundária"
            />
            <div 
              className="w-4 h-4 rounded-full border border-gray-200"
              style={{ backgroundColor: theme.colors.accent }}
              title="Cor de destaque"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const masculineThemes = themes.filter(t => t.category === 'masculine');
  const feminineThemes = themes.filter(t => t.category === 'feminine');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Personalização de Temas
        </CardTitle>
        <p className="text-sm text-gray-600">
          Escolha um tema que combine com o seu negócio
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="masculine" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="masculine">
              Masculinos ({masculineThemes.length})
            </TabsTrigger>
            <TabsTrigger value="feminine">
              Femininos ({feminineThemes.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="masculine" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {masculineThemes.map((theme) => (
                <ThemeCard key={theme.id} theme={theme} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="feminine" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {feminineThemes.map((theme) => (
                <ThemeCard key={theme.id} theme={theme} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Tema atual */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Tema Atual</h4>
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-full"
              style={{ background: selectedTheme.colors.gradient }}
            />
            <div>
              <p className="font-medium text-sm">{selectedTheme.name}</p>
              <p className="text-xs text-gray-600">{selectedTheme.description}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeSelector;