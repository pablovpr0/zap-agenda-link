
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, TrendingUp, Users, DollarSign, Clock } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCompanyAppointments } from '@/services/appointmentService';
import { useToast } from '@/hooks/use-toast';

interface ReportsButtonProps {
  companyId: string;
}

const ReportsButton: React.FC<ReportsButtonProps> = ({ companyId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const { toast } = useToast();

  const periods = {
    thisMonth: {
      label: 'Este mês',
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date())
    },
    lastMonth: {
      label: 'Mês passado',
      start: startOfMonth(subDays(new Date(), 30)),
      end: endOfMonth(subDays(new Date(), 30))
    },
    last30Days: {
      label: 'Últimos 30 dias',
      start: subDays(new Date(), 30),
      end: new Date()
    },
    last90Days: {
      label: 'Últimos 90 dias',
      start: subDays(new Date(), 90),
      end: new Date()
    }
  };

  const loadReportData = async () => {
    if (!companyId || !selectedPeriod) return;

    setLoading(true);
    try {
      const period = periods[selectedPeriod as keyof typeof periods];
      const startDate = format(period.start, 'yyyy-MM-dd');
      const endDate = format(period.end, 'yyyy-MM-dd');

      const appointments = await getCompanyAppointments(companyId, startDate, endDate);
      setReportData(appointments);

      toast({
        title: "Relatório carregado",
        description: `${appointments.length} agendamentos encontrados para ${period.label.toLowerCase()}.`,
      });

    } catch (error: any) {
      console.error('Error loading report data:', error);
      toast({
        title: "Erro ao carregar relatório",
        description: "Não foi possível carregar os dados do relatório.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateStats = () => {
    const total = reportData.length;
    const confirmed = reportData.filter(apt => apt.status === 'confirmed').length;
    const completed = reportData.filter(apt => apt.status === 'completed').length;
    const cancelled = reportData.filter(apt => apt.status === 'cancelled').length;
    
    const totalRevenue = reportData
      .filter(apt => apt.status === 'completed')
      .reduce((sum, apt) => {
        const price = apt.services?.price || 0;
        return sum + (typeof price === 'number' ? price : 0);
      }, 0);

    const serviceStats = reportData.reduce((acc, apt) => {
      const serviceName = apt.services?.name || 'Serviço não especificado';
      acc[serviceName] = (acc[serviceName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      confirmed,
      completed,
      cancelled,
      totalRevenue,
      serviceStats
    };
  };

  const exportToCsv = () => {
    const headers = ['Data', 'Horário', 'Cliente', 'Telefone', 'Serviço', 'Status'];
    const rows = reportData.map(apt => [
      format(new Date(apt.appointment_date), 'dd/MM/yyyy', { locale: ptBR }),
      apt.appointment_time,
      apt.client_name || '',
      apt.clients?.phone || '',
      apt.services?.name || '',
      apt.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-agendamentos-${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Relatório exportado",
      description: "O arquivo CSV foi baixado com sucesso.",
    });
  };

  const stats = reportData.length > 0 ? generateStats() : null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <TrendingUp className="h-4 w-4" />
          Relatórios
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Relatórios de Agendamentos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Period Selection */}
          <div className="flex items-center gap-4">
            <Select
              value={selectedPeriod}
              onValueChange={setSelectedPeriod}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(periods).map(([key, period]) => (
                  <SelectItem key={key} value={key}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={loadReportData} disabled={loading}>
              {loading ? 'Carregando...' : 'Gerar Relatório'}
            </Button>

            {reportData.length > 0 && (
              <Button variant="outline" onClick={exportToCsv} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            )}
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">agendamentos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Concluídos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Confirmados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Receita
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {stats.totalRevenue.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">dos concluídos</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Service Statistics */}
          {stats && Object.keys(stats.serviceStats).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Serviços Mais Solicitados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.serviceStats)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([service, count]) => (
                      <div key={service} className="flex items-center justify-between">
                        <span className="text-sm">{service}</span>
                        <Badge variant="secondary">{String(count)}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appointments Table */}
          {reportData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Lista de Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Data</th>
                        <th className="text-left p-2">Horário</th>
                        <th className="text-left p-2">Cliente</th>
                        <th className="text-left p-2">Serviço</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.slice(0, 50).map((apt) => (
                        <tr key={apt.id} className="border-b">
                          <td className="p-2">
                            {format(new Date(apt.appointment_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </td>
                          <td className="p-2">{apt.appointment_time}</td>
                          <td className="p-2">{apt.client_name || 'N/A'}</td>
                          <td className="p-2">{apt.services?.name || 'N/A'}</td>
                          <td className="p-2">
                            <Badge 
                              variant={
                                apt.status === 'completed' ? 'default' :
                                apt.status === 'confirmed' ? 'secondary' : 'destructive'
                              }
                            >
                              {apt.status === 'completed' ? 'Concluído' :
                               apt.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reportData.length > 50 && (
                    <p className="text-center text-muted-foreground mt-4">
                      Mostrando 50 de {reportData.length} agendamentos
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && reportData.length === 0 && selectedPeriod && (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhum agendamento encontrado para o período selecionado</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportsButton;
