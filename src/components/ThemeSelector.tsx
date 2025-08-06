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
const ThemeSelector = ({
  onThemeChange
}: ThemeSelectorProps) => {
  const {
    toast
  } = useToast();
  const [selectedTheme, setSelectedTheme] = useState<Theme>(loadSavedTheme());
  const handleThemeSelect = (theme: Theme) => {
    setSelectedTheme(theme);
    applyTheme(theme);
    if (onThemeChange) {
      onThemeChange(theme);
    }
    toast({
      title: "Tema aplicado!",
      description: `Tema "${theme.name}" foi aplicado com sucesso.`
    });
  };
  const ThemeCard = ({
    theme
  }: {
    theme: Theme;
  }) => <Card className={`cursor-pointer transition-all hover:shadow-md ${selectedTheme.id === theme.id ? 'ring-2 ring-blue-500' : ''}`} onClick={() => handleThemeSelect(theme)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-full flex-shrink-0" 
            style={{ background: theme.colors.gradient }}
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">{theme.name}</h4>
            <p className="text-xs text-gray-600 mt-1">{theme.description}</p>
            {selectedTheme.id === theme.id && (
              <Badge variant="secondary" className="mt-2">
                <Check className="w-3 h-3 mr-1" />
                Selecionado
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>;
  const masculineThemes = themes.filter(t => t.category === 'masculine');
  const feminineThemes = themes.filter(t => t.category === 'feminine');
  return <Card>
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
            <TabsTrigger value="masculine">Masculinos</TabsTrigger>
            <TabsTrigger value="feminine">Femininos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="masculine" className="space-y-4">
            <div className="grid gap-3">
              {masculineThemes.map((theme) => (
                <ThemeCard key={theme.id} theme={theme} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="feminine" className="space-y-4">
            <div className="grid gap-3">
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
            <div className="w-8 h-8 rounded-full" style={{
            background: selectedTheme.colors.gradient
          }} />
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