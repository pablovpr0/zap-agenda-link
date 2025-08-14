
import { User, Phone, Mail } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ClientFormProps {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  onClientNameChange: (name: string) => void;
  onClientPhoneChange: (phone: string) => void;
  onClientEmailChange: (email: string) => void;
}

const ClientForm = ({ 
  clientName, 
  clientPhone,
  clientEmail,
  onClientNameChange,
  onClientPhoneChange,
  onClientEmailChange
}: ClientFormProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            value={clientName}
            onChange={(e) => onClientNameChange(e.target.value)}
            placeholder="Seu nome completo"
            className="pl-10"
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
            onChange={(e) => onClientPhoneChange(e.target.value)}
            placeholder="(11) 99999-9999"
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            type="email"
            value={clientEmail}
            onChange={(e) => onClientEmailChange(e.target.value)}
            placeholder="seu@email.com (opcional)"
            className="pl-10"
          />
        </div>
      </div>
    </div>
  );
};

export default ClientForm;
