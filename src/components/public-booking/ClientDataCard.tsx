
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ClientDataCardProps {
  clientName: string;
  onClientNameChange: (name: string) => void;
  clientPhone: string;
  onClientPhoneChange: (phone: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
}

const ClientDataCard = ({
  clientName,
  onClientNameChange,
  clientPhone,
  onClientPhoneChange,
  onSubmit,
  isSubmitting = false,
  disabled = false
}: ClientDataCardProps) => {
  // Função para formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    onClientPhoneChange(formatted);
  };

  return (
    <div className="mx-4 mb-6 bg-white rounded-xl shadow-md p-6">
      <h3 className="text-black font-bold text-lg mb-6">SEUS DADOS</h3>

      <div className="space-y-4">
        {/* Campo Nome */}
        <div>
          <input
            type="text"
            value={clientName}
            onChange={(e) => onClientNameChange(e.target.value)}
            placeholder="Seu nome completo"
            disabled={disabled}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[#19c662] focus:outline-none transition-colors disabled:bg-gray-100"
          />
        </div>

        {/* Campo Telefone */}
        <div>
          <input
            type="tel"
            value={clientPhone}
            onChange={handlePhoneChange}
            placeholder="Seu telefone"
            maxLength={15}
            disabled={disabled}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-[#19c662] focus:outline-none transition-colors disabled:bg-gray-100"
          />
        </div>

        {/* Botão Confirmar */}
        <Button
          onClick={onSubmit}
          disabled={disabled || isSubmitting || !clientName.trim() || !clientPhone.trim()}
          className="w-full bg-[#19c662] hover:bg-[#005c39] text-white font-bold py-4 px-6 rounded-lg text-base transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Confirmando...
            </>
          ) : (
            'Confirmar Agendamento'
          )}
        </Button>
      </div>
    </div>
  );
};

export default ClientDataCard;
