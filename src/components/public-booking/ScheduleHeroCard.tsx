
import React from 'react';
import { Calendar, CheckCircle } from 'lucide-react';

const ScheduleHeroCard = () => {
  return (
    <div className="mx-4 mb-6 bg-white public-surface public-card-border rounded-xl shadow-md p-6 text-center">
      {/* Ícone calendário com fundo circular */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 dynamic-selected-bg rounded-full flex items-center justify-center">
          <Calendar className="w-8 h-8 text-[#005c39] dynamic-secondary" />
        </div>
      </div>

      {/* Título */}
      <h2 className="text-xl font-bold text-black public-text mb-3">
        Agende seu horário
      </h2>

      {/* Descrição */}
      <p className="text-gray-600 public-text-secondary text-base mb-4 leading-relaxed">
        Escolha o melhor horário para você e confirme seu agendamento de forma rápida e prática
      </p>

      {/* Confirmação instantânea */}
      <div className="flex items-center justify-center text-[#19c662] dynamic-primary font-medium">
        <CheckCircle className="w-5 h-5 mr-2" />
        <span>Confirmação instantânea</span>
      </div>
    </div>
  );
};

export default ScheduleHeroCard;
