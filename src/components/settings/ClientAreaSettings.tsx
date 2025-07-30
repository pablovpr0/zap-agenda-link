
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Camera, Upload, Moon, Sun, Heart, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ClientAreaCustomizationData {
  logo: null;
  coverImage: null;
  themeColor: string;
  companyName: string;
  isDarkMode: boolean;
  selectedTheme: string;
}

interface ClientAreaSettingsProps {
  customization: ClientAreaCustomizationData;
  onCustomizationChange: (customization: ClientAreaCustomizationData) => void;
}

const predefinedThemes = [
  { id: 'classic-green', name: 'Verde Clássico', color: '#22c55e', category: 'unisex', icon: '🌿' },
  { id: 'elegant-blue', name: 'Azul Elegante', color: '#3b82f6', category: 'masculine', icon: '💼' },
  { id: 'warm-pink', name: 'Rosa Acolhedor', color: '#ec4899', category: 'feminine', icon: '🌸' },
  { id: 'royal-purple', name: 'Roxo Real', color: '#8b5cf6', category: 'feminine', icon: '👑' },
  { id: 'sunset-orange', name: 'Laranja Vibrante', color: '#f97316', category: 'unisex', icon: '🧡' },
  { id: 'ocean-teal', name: 'Verde Oceano', color: '#14b8a6', category: 'unisex', icon: '🌊' },
  { id: 'golden-yellow', name: 'Dourado', color: '#eab308', category: 'unisex', icon: '✨' },
  { id: 'deep-navy', name: 'Azul Marinho', color: '#1e40af', category: 'masculine', icon: '⚓' },
  { id: 'soft-lavender', name: 'Lavanda Suave', color: '#a855f7', category: 'feminine', icon: '💜' },
  { id: 'forest-green', name: 'Verde Floresta', color: '#16a34a', category: 'masculine', icon: '🌲' },
];

const ClientAreaSettings = ({ customization, onCustomizationChange }: ClientAreaSettingsProps) => {
  const [filter, setFilter] = useState<'all' | 'masculine' | 'feminine'>('all');

  const updateCustomization = (key: keyof ClientAreaCustomizationData, value: any) => {
    onCustomizationChange({ ...customization, [key]: value });
  };

  const selectTheme = (theme: typeof predefinedThemes[0]) => {
    updateCustomization('themeColor', theme.color);
    updateCustomization('selectedTheme', theme.id);
  };

  const filteredThemes = predefinedThemes.filter(theme => {
    if (filter === 'all') return true;
    return theme.category === filter || theme.category === 'unisex';
  });

  return (
    <Card className="bg-white border-whatsapp">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg text-gray-800">
          <Palette className="w-4 md:w-5 h-4 md:h-5 text-whatsapp-green" />
          Personalizar Área do Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company Name */}
        <div>
          <Label htmlFor="company-display-name">Nome da Empresa (exibição)</Label>
          <Input
            id="company-display-name"
            value={customization.companyName}
            onChange={(e) => updateCustomization('companyName', e.target.value)}
            className="border-whatsapp"
          />
        </div>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-2">
            {customization.isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            <div>
              <Label>Modo Escuro</Label>
              <p className="text-sm text-gray-500">Tema escuro para melhor experiência noturna</p>
            </div>
          </div>
          <Button
            variant={customization.isDarkMode ? "default" : "outline"}
            onClick={() => updateCustomization('isDarkMode', !customization.isDarkMode)}
          >
            {customization.isDarkMode ? 'Ativado' : 'Ativar'}
          </Button>
        </div>

        {/* Theme Filter */}
        <div>
          <Label className="text-base font-medium">Temas Pré-definidos</Label>
          <div className="flex gap-2 mt-2 mb-4">
            <Button 
              size="sm" 
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              Todos
            </Button>
            <Button 
              size="sm" 
              variant={filter === 'masculine' ? 'default' : 'outline'}
              onClick={() => setFilter('masculine')}
              className="flex items-center gap-1"
            >
              <Briefcase className="w-3 h-3" />
              Masculino
            </Button>
            <Button 
              size="sm" 
              variant={filter === 'feminine' ? 'default' : 'outline'}
              onClick={() => setFilter('feminine')}
              className="flex items-center gap-1"
            >
              <Heart className="w-3 h-3" />
              Feminino
            </Button>
          </div>

          {/* Theme Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredThemes.map((theme) => (
              <div
                key={theme.id}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  customization.selectedTheme === theme.id ? 'border-current shadow-md' : 'border-gray-200'
                }`}
                style={{ borderColor: customization.selectedTheme === theme.id ? theme.color : undefined }}
                onClick={() => selectTheme(theme)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: theme.color }}
                  />
                  <span className="text-lg">{theme.icon}</span>
                </div>
                <p className="text-sm font-medium">{theme.name}</p>
                <div className="flex gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {theme.category === 'masculine' ? 'Masculino' : 
                     theme.category === 'feminine' ? 'Feminino' : 'Unisex'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Custom Color */}
        <div>
          <Label htmlFor="theme-color">Cor Personalizada</Label>
          <div className="flex items-center gap-2 mt-2">
            <Input
              id="theme-color"
              type="color"
              value={customization.themeColor}
              onChange={(e) => updateCustomization('themeColor', e.target.value)}
              className="w-16 h-10 border-whatsapp"
            />
            <Input
              value={customization.themeColor}
              onChange={(e) => updateCustomization('themeColor', e.target.value)}
              className="flex-1 border-whatsapp"
              placeholder="#000000"
            />
          </div>
        </div>
        
        {/* Profile and Cover Images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Foto do Perfil</Label>
            <div className="border-2 border-dashed border-whatsapp rounded-lg p-4 text-center mt-2">
              <Camera className="w-8 h-8 text-whatsapp-muted mx-auto mb-2" />
              <p className="text-sm text-whatsapp-muted mb-2">Clique para enviar foto do perfil</p>
              <Button variant="outline" size="sm" className="border-whatsapp">
                <Upload className="w-4 h-4 mr-2" />
                Enviar Foto
              </Button>
            </div>
          </div>
          
          <div>
            <Label>Foto de Capa</Label>
            <div className="border-2 border-dashed border-whatsapp rounded-lg p-4 text-center mt-2">
              <Camera className="w-8 h-8 text-whatsapp-muted mx-auto mb-2" />
              <p className="text-sm text-whatsapp-muted mb-2">Clique para enviar foto de capa</p>
              <Button variant="outline" size="sm" className="border-whatsapp">
                <Upload className="w-4 h-4 mr-2" />
                Enviar Capa
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientAreaSettings;
