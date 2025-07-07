
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Camera, Upload } from 'lucide-react';

interface ClientAreaCustomizationData {
  logo: null;
  coverImage: null;
  themeColor: string;
  companyName: string;
}

interface ClientAreaSettingsProps {
  customization: ClientAreaCustomizationData;
  onCustomizationChange: (customization: ClientAreaCustomizationData) => void;
}

const ClientAreaSettings = ({ customization, onCustomizationChange }: ClientAreaSettingsProps) => {
  const updateCustomization = (key: keyof ClientAreaCustomizationData, value: string) => {
    onCustomizationChange({ ...customization, [key]: value });
  };

  return (
    <Card className="bg-white border-whatsapp">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg text-gray-800">
          <Palette className="w-4 md:w-5 h-4 md:h-5 text-whatsapp-green" />
          Personalizar Área do Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="company-display-name">Nome da Empresa (exibição)</Label>
          <Input
            id="company-display-name"
            value={customization.companyName}
            onChange={(e) => updateCustomization('companyName', e.target.value)}
            className="border-whatsapp"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Foto do Perfil</Label>
            <div className="border-2 border-dashed border-whatsapp rounded-lg p-4 text-center">
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
            <div className="border-2 border-dashed border-whatsapp rounded-lg p-4 text-center">
              <Camera className="w-8 h-8 text-whatsapp-muted mx-auto mb-2" />
              <p className="text-sm text-whatsapp-muted mb-2">Clique para enviar foto de capa</p>
              <Button variant="outline" size="sm" className="border-whatsapp">
                <Upload className="w-4 h-4 mr-2" />
                Enviar Capa
              </Button>
            </div>
          </div>
        </div>
        
        <div>
          <Label htmlFor="theme-color">Cor do Tema</Label>
          <div className="flex items-center gap-2">
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
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientAreaSettings;
