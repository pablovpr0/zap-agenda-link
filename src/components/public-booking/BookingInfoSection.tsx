
import { Calendar, CheckCircle } from 'lucide-react';

const BookingInfoSection = () => {
  return (
    <div className="mb-8 bg-white rounded-2xl p-6 shadow-lg border border-green-100">
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-full">
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Agende seu horário
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            Escolha o melhor horário para você e confirme seu agendamento de forma rápida e prática
          </p>
          <div className="flex items-center justify-center gap-3 text-green-600 bg-green-50 p-3 rounded-xl">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-semibold">Confirmação instantânea</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingInfoSection;
