
import { Clock, X } from 'lucide-react';

interface EmptyStatesProps {
  type: 'no-date' | 'loading' | 'no-slots';
}

export const EmptyStates = ({ type }: EmptyStatesProps) => {
  if (type === 'no-date') {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Selecione uma data primeiro</p>
      </div>
    );
  }

  if (type === 'loading') {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green mx-auto"></div>
        <p className="mt-2 text-gray-500">Carregando horários...</p>
      </div>
    );
  }

  if (type === 'no-slots') {
    return (
      <div className="text-center py-8 text-gray-500">
        <X className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Nenhum horário disponível para esta data</p>
        <p className="text-sm">Tente selecionar outro dia</p>
      </div>
    );
  }

  return null;
};
