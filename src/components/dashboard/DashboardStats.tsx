
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
      <Card className="hover:shadow-md transition-shadow bg-white border-whatsapp">
        <CardContent className="p-3 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-whatsapp-muted">Hoje</p>
              <p className="text-lg md:text-2xl font-bold text-gray-800">{stats.todayAppointments}</p>
            </div>
            <Calendar className="w-6 md:w-8 h-6 md:h-8 text-whatsapp-green" />
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow bg-white border-whatsapp">
        <CardContent className="p-3 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-whatsapp-muted">Clientes</p>
              <p className="text-lg md:text-2xl font-bold text-gray-800">{stats.totalClients}</p>
            </div>
            <Users className="w-6 md:w-8 h-6 md:h-8 text-whatsapp-green" />
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow bg-white border-whatsapp">
        <CardContent className="p-3 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-whatsapp-muted">Receita</p>
              <p className="text-lg md:text-2xl font-bold text-gray-800">R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <DollarSign className="w-6 md:w-8 h-6 md:h-8 text-whatsapp-green" />
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow bg-white border-whatsapp">
        <CardContent className="p-3 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-whatsapp-muted">Taxa</p>
              <p className="text-lg md:text-2xl font-bold text-gray-800">{stats.completionRate}%</p>
            </div>
            <TrendingUp className="w-6 md:w-8 h-6 md:h-8 text-whatsapp-green" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
