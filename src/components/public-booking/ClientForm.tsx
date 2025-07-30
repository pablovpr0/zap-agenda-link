
import { User, Phone } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ClientFormProps {
  clientName: string;
  clientPhone: string;
  onNameChange: (name: string) => void;
  onPhoneChange: (phone: string) => void;
}

const ClientForm = ({ 
  clientName, 
  clientPhone,
  onNameChange,
  onPhoneChange
}: ClientFormProps) => {
  return (
    <div className="space-y-4">
      <Label className="text-gray-700 font-medium">Seus dados</Label>
      
      <div className="space-y-2">
        <div className="relative">
          <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            value={clientName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Seu nome completo"
            className="pl-10 public-border-primary border-opacity-30 focus:public-border-primary focus:ring-opacity-20 bg-opacity-10 public-bg-primary"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            type="tel"
            value={clientPhone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="(11) 99999-9999"
            className="pl-10 public-border-primary border-opacity-30 focus:public-border-primary focus:ring-opacity-20 bg-opacity-10 public-bg-primary"
            required
          />
        </div>
      </div>
    </div>
  );
};

export default ClientForm;
