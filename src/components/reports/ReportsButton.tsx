import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Calendar } from 'lucide-react';
import { Download, TrendingUp, Users } from 'lucide-react';
import { generateReport } from '@/services/reportsService';
import { saveAs } from 'file-saver';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface ReportStats {
  totalAppointments: number;
  totalRevenue: number;
  completionRate: number;
  appointmentsGrowth: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface ReportsButtonProps {
  companyId: string;
}

const ReportsButton: React.FC<ReportsButtonProps> = ({ companyId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ReportStats>({
    totalAppointments: 0,
    totalRevenue: 0,
    completionRate: 0,
    appointmentsGrowth: 0,
  });
  const [chartData, setChartData] = useState<MonthlyRevenue[]>([]);

  useEffect(() => {
    const loadReportData = async () => {
      if (!companyId) return;

      setLoading(true);
      try {
        const report = await generateReport(companyId);
        setStats({
          totalAppointments: report.totalAppointments,
          totalRevenue: report.totalRevenue,
          completionRate: report.completionRate,
          appointmentsGrowth: report.appointmentsGrowth,
        });

        // Generate chart data for the last 6 months
        const monthlyData: MonthlyRevenue[] = [];
        for (let i = 5; i >= 0; i--) {
          const date = subMonths(new Date(), i);
          const monthName = format(date, 'MMMM', { locale: ptBR });
          const revenue = report.monthlyRevenue[monthName] || 0;
          monthlyData.push({ month: monthName, revenue: revenue });
        }
        setChartData(monthlyData);

      } catch (error: any) {
        console.error('Error generating report:', error);
        toast({
          title: "Erro ao gerar relatório",
          description: error.message || "Não foi possível gerar o relatório.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [companyId, toast]);

  const handleDownloadReport = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const report = await generateReport(user.id);
      const json = JSON.stringify(report);
      const blob = new Blob([json], { type: 'application/json' });
      saveAs(blob, `relatorio-${format(new Date(), 'yyyy-MM-dd')}.json`);

      toast({
        title: "Relatório gerado!",
        description: "O relatório foi baixado com sucesso.",
      });
    } catch (error: any) {
      console.error('Error downloading report:', error);
      toast({
        title: "Erro ao baixar relatório",
        description: error.message || "Não foi possível baixar o relatório.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={handleDownloadReport} disabled={loading}>
        {loading ? (
          <>
            Gerando...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Gerar Relatório
          </>
        )}
      </Button>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAppointments}</div>
              <p className="text-xs text-muted-foreground">
                +{Number(stats.appointmentsGrowth) || 0}% desde o mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {Number(stats.totalRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Number(stats.completionRate).toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `R$ ${value}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']}
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportsButton;
