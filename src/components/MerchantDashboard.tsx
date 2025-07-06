
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, DollarSign, Users, TrendingUp, Eye } from 'lucide-react';

const MerchantDashboard = () => {
  // Dados mockados - em uma implementação real, viriam de uma API
  const stats = {
    todayAppointments: 8,
    weekRevenue: 1250,
    totalClients: 127,
    conversionRate: 78
  };

  const recentBookings = [
    { id: 1, name: 'Maria Silva', service: 'Corte Feminino', time: '09:00', status: 'confirmado' },
    { id: 2, name: 'João Santos', service: 'Corte Masculino', time: '10:30', status: 'confirmado' },
    { id: 3, name: 'Ana Costa', service: 'Escova', time: '14:00', status: 'pendente' },
    { id: 4, name: 'Pedro Lima', service: 'Coloração', time: '15:30', status: 'confirmado' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Olá, Salão Beleza & Estilo! 👋</h2>
        <p className="text-gray-600">Aqui está um resumo do seu negócio hoje.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Agendamentos Hoje</p>
                <p className="text-2xl font-bold text-primary">{stats.todayAppointments}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receita Semanal</p>
                <p className="text-2xl font-bold text-green-600">R$ {stats.weekRevenue}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Clientes</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalClients}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-purple-600">{stats.conversionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button className="bg-primary hover:bg-primary/90">
            <Calendar className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Ver Link Público
          </Button>
          <Button variant="outline">
            <Users className="w-4 h-4 mr-2" />
            Gerenciar Clientes
          </Button>
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Agendamentos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{booking.name}</p>
                    <p className="text-sm text-gray-600">{booking.service}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-medium text-gray-800">{booking.time}</p>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Link Section */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Seu Link de Agendamento</h3>
            <p className="text-gray-600">Compartilhe este link com seus clientes para que possam agendar facilmente:</p>
            <div className="bg-white p-3 rounded-lg border">
              <code className="text-primary font-mono">zapagenda.com/salao-beleza-estilo</code>
            </div>
            <Button className="bg-primary hover:bg-primary/90">
              <Eye className="w-4 h-4 mr-2" />
              Copiar Link
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MerchantDashboard;
