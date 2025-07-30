
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { FileText, Download, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ReportsButton = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    if (!startDate || !endDate || !user) {
      toast({
        title: "Selecione o período",
        description: "Por favor, selecione as datas de início e fim.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      // Buscar dados do relatório
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients(name, phone),
          services(name, price)
        `)
        .eq('company_id', user.id)
        .eq('status', 'completed')
        .gte('appointment_date', format(startDate, 'yyyy-MM-dd'))
        .lte('appointment_date', format(endDate, 'yyyy-MM-dd'))
        .order('appointment_date');

      if (error) throw error;

      // Processar dados
      const totalClients = new Set((appointments || []).map(apt => apt.clients?.name)).size;
      const serviceStats = (appointments || []).reduce((acc: any, apt: any) => {
        const serviceName = apt.services?.name || 'Serviço não especificado';
        acc[serviceName] = (acc[serviceName] || 0) + 1;
        return acc;
      }, {});

      const totalRevenue = (appointments || []).reduce((total, apt: any) => {
        return total + (apt.services?.price || 0);
      }, 0);

      // Gerar texto do relatório
      const reportText = `📊 *RELATÓRIO DE ATENDIMENTOS*

📅 *Período:* ${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}

👥 *Total de Clientes Atendidos:* ${totalClients}

📋 *Procedimentos Realizados:*
${Object.entries(serviceStats).map(([service, count]) => `• ${service}: ${count}x`).join('\n')}

💰 *Faturamento Total:* R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

✅ Total de Atendimentos: ${appointments?.length || 0}`;

      return reportText;

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório.",
        variant: "destructive",
      });
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    const reportText = await generateReport();
    if (!reportText) return;

    // Criar e baixar arquivo de texto (simulando PDF)
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${format(startDate!, 'yyyy-MM-dd')}_${format(endDate!, 'yyyy-MM-dd')}.txt`;
    link.click();

    toast({
      title: "Relatório baixado!",
      description: "O relatório foi salvo em seu dispositivo.",
    });
  };

  const handleSendWhatsApp = async () => {
    const reportText = await generateReport();
    if (!reportText) return;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(reportText)}`;
    window.open(whatsappUrl, '_blank');

    toast({
      title: "WhatsApp aberto!",
      description: "O relatório foi enviado para o WhatsApp.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-whatsapp-green hover:bg-green-600">
          <FileText className="w-4 h-4 mr-2" />
          Gerar Relatório
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Gerar Relatório de Atendimentos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                disabled={(date) => date > new Date()}
                locale={ptBR}
                className="rounded-md border"
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Fim</Label>
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                disabled={(date) => date > new Date() || (startDate && date < startDate)}
                locale={ptBR}
                className="rounded-md border"
              />
            </div>
          </div>

          {startDate && endDate && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleDownloadPDF}
                disabled={generating}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {generating ? 'Gerando...' : 'Baixar PDF'}
              </Button>
              
              <Button 
                onClick={handleSendWhatsApp}
                disabled={generating}
                variant="outline"
                className="flex items-center gap-2 border-green-200 text-green-600 hover:bg-green-50"
              >
                <MessageCircle className="w-4 h-4" />
                {generating ? 'Gerando...' : 'Enviar WhatsApp'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportsButton;
