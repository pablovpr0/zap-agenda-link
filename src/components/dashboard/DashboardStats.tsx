
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users, DollarSign, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    todayAppointments: number;
    totalClients: number;
    monthlyRevenue: number;
    completionRate: number;
  };
}

const DashboardStats = ({ stats }: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Card className="hover:shadow-md transition-shadow bg-white border-whatsapp overflow-hidden">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between min-w-0">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-whatsapp-muted truncate">Hoje</p>
              <p className="text-base md:text-xl lg:text-2xl font-bold text-gray-800 truncate">{stats.todayAppointments}</p>
            </div>
            <Calendar className="w-5 md:w-6 lg:w-8 h-5 md:h-6 lg:h-8 text-whatsapp-green flex-shrink-0 ml-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow bg-white border-whatsapp overflow-hidden">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between min-w-0">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-whatsapp-muted truncate">Clientes</p>
              <p className="text-base md:text-xl lg:text-2xl font-bold text-gray-800 truncate">{stats.totalClients}</p>
            </div>
            <Users className="w-5 md:w-6 lg:w-8 h-5 md:h-6 lg:h-8 text-whatsapp-green flex-shrink-0 ml-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow bg-white border-whatsapp overflow-hidden">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between min-w-0">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-whatsapp-muted truncate">Receita</p>
              <p className="text-sm md:text-lg lg:text-xl font-bold text-gray-800 truncate">
                R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign className="w-5 md:w-6 lg:w-8 h-5 md:h-6 lg:h-8 text-whatsapp-green flex-shrink-0 ml-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow bg-white border-whatsapp overflow-hidden">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between min-w-0">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-whatsapp-muted truncate">Taxa</p>
              <p className="text-base md:text-xl lg:text-2xl font-bold text-gray-800 truncate">{stats.completionRate}%</p>
            </div>
            <TrendingUp className="w-5 md:w-6 lg:w-8 h-5 md:h-6 lg:h-8 text-whatsapp-green flex-shrink-0 ml-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
