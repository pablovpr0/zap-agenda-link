
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Eye, MessageCircle, Copy, Share2, Phone, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MerchantDashboardProps {
  companyName: string;
}

const MerchantDashboard = ({ companyName }: MerchantDashboardProps) => {
  const [showTodayAppointments, setShowTodayAppointments] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Dados mockados
  const stats = {
    todayAppointments: 8
  };

  const todayClients = [
    { id: 1, name: 'Maria Silva', service: 'Corte Feminino', time: '09:00', phone: '(11) 99999-1111', status: 'confirmado' },
    { id: 2, name: 'João Santos', service: 'Corte Masculino', time: '10:30', phone: '(11) 99999-2222', status: 'confirmado' },
    { id: 3, name: 'Ana Costa', service: 'Escova', time: '14:00', phone: '(11) 99999-3333', status: 'pendente' },
    { id: 4, name: 'Pedro Lima', service: 'Coloração', time: '15:30', phone: '(11) 99999-4444', status: 'confirmado' },
  ];

  const recentBookings = [
    { id: 1, name: 'Maria Silva', service: 'Corte Feminino', time: '09:00', phone: '(11) 99999-1111', date: '15/01/2024', status: 'confirmado' },
    { id: 2, name: 'João Santos', service: 'Corte Masculino', time: '10:30', phone: '(11) 99999-2222', date: '15/01/2024', status: 'confirmado' },
    { id: 3, name: 'Ana Costa', service: 'Escova', time: '14:00', phone: '(11) 99999-3333', date: '16/01/2024', status: 'pendente' },
    { id: 4, name: 'Pedro Lima', service: 'Coloração', time: '15:30', phone: '(11) 99999-4444', date: '17/01/2024', status: 'confirmado' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const sendWhatsAppMessage = (client: any) => {
    const message = encodeURIComponent(`Olá ${client.name}! Estou passando para confirmar se o horário hoje às ${client.time} está mantido. Posso confirmar?`);
    const phone = client.phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const copyLink = () => {
    const publicLink = `zapagenda.com/${companyName.toLowerCase().replace(/\s+/g, '-')}`;
    navigator.clipboard.writeText(publicLink);
  };

  const shareLink = () => {
    const publicLink = `zapagenda.com/${companyName.toLowerCase().replace(/\s+/g, '-')}`;
    if (navigator.share) {
      navigator.share({
        title: 'Agende seu horário',
        text: 'Agende seu horário conosco através deste link:',
        url: publicLink
      });
    } else {
      copyLink();
    }
  };

  const handleNewAppointment = () => {
    // Implementar modal ou navegação para novo agendamento
    alert('Funcionalidade de novo agendamento será implementada em breve');
  };

  const handleViewPublicLink = () => {
    const publicLink = `zapagenda.com/${companyName.toLowerCase().replace(/\s+/g, '-')}`;
    window.open(`https://${publicLink}`, '_blank');
  };

  const handleManageClients = () => {
    // Implementar tela de gerenciar clientes
    alert('Funcionalidade de gerenciar clientes será implementada em breve');
  };

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 fade-in">
      {/* Welcome Section */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Olá, {companyName}! 👋</h2>
        <p className="text-gray-600 text-sm">Aqui está um resumo do seu negócio hoje.</p>
      </div>

      {/* Stats Card */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Agendamentos Hoje</p>
              <p className="text-xl md:text-2xl font-bold text-primary">{stats.todayAppointments}</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 md:w-6 h-5 md:h-6 text-primary/60" />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowTodayAppointments(true)}
              >
                Ver Lista
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Clock className="w-4 md:w-5 h-4 md:h-5 text-primary" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button className="bg-primary hover:bg-primary/90 w-full" onClick={handleNewAppointment}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
          <Button variant="outline" className="w-full" onClick={handleViewPublicLink}>
            <Eye className="w-4 h-4 mr-2" />
            Ver Página do Cliente
          </Button>
          <Button variant="outline" className="w-full" onClick={handleManageClients}>
            <Users className="w-4 h-4 mr-2" />
            Gerenciar Clientes
          </Button>
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Calendar className="w-4 md:w-5 h-4 md:h-5 text-primary" />
            Agendamentos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <div 
                key={booking.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedBooking(booking)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 md:w-10 h-8 md:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 md:w-5 h-4 md:h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 text-sm md:text-base truncate">{booking.name}</p>
                    <p className="text-xs md:text-sm text-gray-600">{booking.service}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="font-medium text-gray-800 text-sm md:text-base">{booking.date}</p>
                    <p className="text-xs md:text-sm text-gray-600">{booking.time}</p>
                    <Badge className={`${getStatusColor(booking.status)} text-xs`}>
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
        <CardContent className="p-4 md:p-6">
          <div className="text-center space-y-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-800">Seu Link de Agendamento</h3>
            <p className="text-gray-600 text-sm">Compartilhe este link com seus clientes para que possam agendar facilmente:</p>
            <div className="bg-white p-3 rounded-lg border">
              <code className="text-primary font-mono text-xs md:text-sm break-all">
                zapagenda.com/{companyName.toLowerCase().replace(/\s+/g, '-')}
              </code>
            </div>
            <div className="flex flex-col md:flex-row gap-2 justify-center">
              <Button className="bg-primary hover:bg-primary/90" onClick={copyLink}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar Link
              </Button>
              <Button variant="outline" onClick={shareLink}>
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para lista de agendamentos de hoje */}
      <Dialog open={showTodayAppointments} onOpenChange={setShowTodayAppointments}>
        <DialogContent className="max-w-md mx-3">
          <DialogHeader>
            <DialogTitle>Agendamentos de Hoje</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {todayClients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{client.name}</p>
                  <p className="text-sm text-gray-600">{client.time} - {client.service}</p>
                </div>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 ml-2"
                  onClick={() => sendWhatsAppMessage(client)}
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para detalhes do agendamento */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md mx-3">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes do Agendamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-gray-800">Nome:</p>
                  <p className="text-gray-600">{selectedBooking.name}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Telefone:</p>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600 flex-1 text-sm">{selectedBooking.phone}</p>
                    <Button size="sm" variant="outline" onClick={() => window.open(`tel:${selectedBooking.phone}`)}>
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Data e Horário:</p>
                  <p className="text-gray-600">{selectedBooking.date} às {selectedBooking.time}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Serviço:</p>
                  <p className="text-gray-600">{selectedBooking.service}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Status:</p>
                  <Badge className={getStatusColor(selectedBooking.status)}>
                    {selectedBooking.status}
                  </Badge>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MerchantDashboard;
