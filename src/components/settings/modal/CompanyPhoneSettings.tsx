
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Phone } from 'lucide-react';

interface CompanyPhoneSettingsProps {
  phone: string;
  onPhoneChange: (phone: string) => void;
}

const CompanyPhoneSettings = ({ phone, onPhoneChange }: CompanyPhoneSettingsProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="phone" className="flex items-center gap-2">
        <Phone className="w-4 h-4 text-whatsapp-green" />
        Telefone da Empresa
      </Label>
      <Input
        id="phone"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        placeholder="(11) 99999-9999"
      />
      <p className="text-xs text-gray-500">
        Telefone para receber mensagens de confirmação de agendamentos
      </p>
    </div>
  );
};

export default CompanyPhoneSettings;
