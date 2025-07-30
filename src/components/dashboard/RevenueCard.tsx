import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DollarSign, TrendingUp, Calendar, Eye, Clock } from 'lucide-react';
import { useRevenue } from '@/hooks/useRevenue';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const RevenueCard = () => {
  const { dailyRevenue, monthlyRevenue, loading, loadMonthlyRevenue } = useRevenue();
  const [showDetails, setShowDetails] = useState(false);

  const handleShowMonthly = () => {
    if (!monthlyRevenue) {
      loadMonthlyRevenue();
    }
    setShowDetails(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita de Hoje</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(dailyRevenue?.netRevenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {dailyRevenue?.appointmentsCount || 0} agendamento(s) hoje
              </p>
            </div>

            {dailyRevenue && dailyRevenue.cancelledRevenue > 0 && (
              <div className="text-xs text-red-600">
                {formatCurrency(dailyRevenue.cancelledRevenue)} em cancelamentos
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleShowMonthly}
                className="flex-1"
              >
                <Eye className="w-3 h-3 mr-1" />
                Ver Detalhes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Receita Detalhada
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Receita de Hoje */}
            {dailyRevenue && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Hoje - {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Receita Total</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(dailyRevenue.totalRevenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Agendamentos</p>
                      <p className="text-xl font-bold">
                        {dailyRevenue.appointmentsCount}
                      </p>
                    </div>
                  </div>

                  {dailyRevenue.appointments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Agendamentos de Hoje:</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {dailyRevenue.appointments.map((apt) => (
                          <div key={apt.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span className="text-sm font-medium">
                                  {apt.appointmentTime.substring(0, 5)}
                                </span>
                                <Badge className={`text-xs ${getStatusColor(apt.status)}`}>
                                  {getStatusText(apt.status)}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600">
                                {apt.clientName} - {apt.serviceName}
                              </p>
                            </div>
                            <div className="text-sm font-medium">
                              {formatCurrency(apt.servicePrice)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Receita Mensal */}
            {monthlyRevenue && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo do Mês</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total do Mês</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(monthlyRevenue.totalRevenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Agendamentos</p>
                      <p className="text-lg font-bold">
                        {monthlyRevenue.totalAppointments}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Média Diária</p>
                      <p className="text-lg font-bold">
                        {formatCurrency(monthlyRevenue.averageDailyRevenue)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RevenueCard;