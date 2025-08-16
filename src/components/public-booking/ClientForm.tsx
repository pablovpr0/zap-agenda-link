
import { User, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { isPhoneValidFormat, isPhoneComplete } from '@/utils/inputValidation';

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
            className={`pl-10 pr-10 ${
              clientPhone && isPhoneComplete(clientPhone) 
                ? isPhoneValidFormat(clientPhone)
                  ? 'border-green-500 focus:border-green-500' 
                  : 'border-red-500 focus:border-red-500'
                : ''
            }`}
            required
          />
          {clientPhone && isPhoneComplete(clientPhone) && (
            <div className="absolute right-3 top-3">
              {isPhoneValidFormat(clientPhone) ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          )}
        </div>
        {clientPhone && isPhoneComplete(clientPhone) && !isPhoneValidFormat(clientPhone) && (
          <p className="text-sm text-red-600">
            Formato de telefone inválido. Use: (11) 99999-9999
          </p>
        )}
        {clientPhone && isPhoneComplete(clientPhone) && isPhoneValidFormat(clientPhone) && (
          <p className="text-sm text-green-600">
            ✓ Telefone válido - horários serão carregados
          </p>
        )}
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
