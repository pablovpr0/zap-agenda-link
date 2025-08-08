
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

interface RevenueCardProps {
  stats: {
    monthlyRevenue: number;
  };
}

const RevenueCard = ({ stats }: RevenueCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow bg-white border-whatsapp overflow-hidden lg:col-span-3">
      <CardContent className="p-3 md:p-4">
        <div className="flex items-center justify-between min-w-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs md:text-sm font-medium text-whatsapp-muted truncate">Receita Mensal</p>
            <p className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-800 truncate">
              R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-whatsapp-muted mt-1">
              Apenas agendamentos concluídos
            </p>
          </div>
          <DollarSign className="w-6 md:w-8 lg:w-10 h-6 md:h-8 lg:h-10 text-whatsapp-green flex-shrink-0 ml-2" />
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueCard;
