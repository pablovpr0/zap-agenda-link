
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Instagram } from 'lucide-react';

interface CompanyDataSettingsData {
  name: string;
  address: string;
  phone: string;
  email: string;
  instagramUrl: string;
}

interface CompanyDataSettingsProps {
  data: CompanyDataSettingsData;
  onDataChange: (data: CompanyDataSettingsData) => void;
}

const CompanyDataSettings = ({ data, onDataChange }: CompanyDataSettingsProps) => {
  const updateData = (key: keyof CompanyDataSettingsData, value: string) => {
    onDataChange({ ...data, [key]: value });
  };

  return (
    <Card className="bg-white border-whatsapp">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg text-gray-800">
          <MapPin className="w-4 md:w-5 h-4 md:h-5 text-whatsapp-green" />
          Dados Básicos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company-name">Nome da Empresa</Label>
            <Input
              id="company-name"
              value={data.name}
              onChange={(e) => updateData('name', e.target.value)}
              className="border-whatsapp"
            />
          </div>
          <div>
            <Label htmlFor="company-phone">Telefone</Label>
            <Input
              id="company-phone"
              value={data.phone}
              onChange={(e) => updateData('phone', e.target.value)}
              className="border-whatsapp"
            />
          </div>
          <div>
            <Label htmlFor="company-email">E-mail</Label>
            <Input
              id="company-email"
              type="email"
              value={data.email}
              onChange={(e) => updateData('email', e.target.value)}
              className="border-whatsapp"
            />
          </div>
          <div>
            <Label htmlFor="instagram-url">Instagram</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-whatsapp bg-gray-50 text-whatsapp-muted text-sm">
                <Instagram className="w-4 h-4" />
              </span>
              <Input
                id="instagram-url"
                value={data.instagramUrl}
                onChange={(e) => updateData('instagramUrl', e.target.value)}
                className="rounded-l-none border-whatsapp"
                placeholder="@seuusuario"
              />
            </div>
          </div>
        </div>
        
        <div>
          <Label htmlFor="company-address">Endereço Completo</Label>
          <Input
            id="company-address"
            value={data.address}
            onChange={(e) => updateData('address', e.target.value)}
            className="border-whatsapp"
            placeholder="Rua das Flores, 123 - Centro - Cidade/UF"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyDataSettings;
