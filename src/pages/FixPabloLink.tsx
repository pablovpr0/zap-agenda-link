import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createPabloCompany, checkPabloCompany } from '@/utils/createPabloCompany';
import { Badge } from '@/components/ui/badge';

const FixPabloLink = () => {
  const [loading, setLoading] = useState(false);
  const [companyExists, setCompanyExists] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);
  const { toast } = useToast();

  const checkCompany = async () => {
    setLoading(true);
    try {
      const result = await checkPabloCompany();
      setCompanyExists(result.exists);
      setCompanyData(result.data);
      
      if (result.exists) {
        toast({
          title: "Empresa encontrada!",
          description: "A empresa 'pablo' já existe no banco de dados.",
        });
      } else {
        toast({
          title: "Empresa não encontrada",
          description: "A empresa 'pablo' não existe. Clique em 'Criar Empresa' para criá-la.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: `Erro ao verificar empresa: ${error}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCompany = async () => {
    setLoading(true);
    try {
      const result = await createPabloCompany();
      
      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Empresa 'pablo' criada com sucesso!",
        });
        await checkCompany(); // Recarregar dados
      } else {
        toast({
          title: "Erro",
          description: `Erro ao criar empresa: ${result.error?.message}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: `Erro inesperado: ${error}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testLink = () => {
    window.open('http://localhost:8081/pablo', '_blank');
  };

  const testDebugLink = () => {
    window.open('http://localhost:8081/debug/pablo', '_blank');
  };

  useEffect(() => {
    checkCompany();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Corrigir Link Público - Pablo</CardTitle>
          <CardDescription>
            Diagnóstico e correção do problema com o link público de agendamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status da empresa */}
          <div className="flex items-center gap-2">
            <span>Status da empresa:</span>
            <Badge variant={companyExists ? "default" : "destructive"}>
              {companyExists ? "Existe" : "Não existe"}
            </Badge>
          </div>

          {/* Informações da empresa */}
          {companyData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dados da Empresa</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong>Slug:</strong> {companyData.slug}</p>
                <p><strong>ID:</strong> {companyData.company_id}</p>
                <p><strong>Horário:</strong> {companyData.working_hours_start} - {companyData.working_hours_end}</p>
                <p><strong>Dias:</strong> {companyData.working_days?.join(', ')}</p>
                <p><strong>Serviços:</strong> {companyData.services?.length || 0}</p>
                <p><strong>Mensagem:</strong> {companyData.welcome_message}</p>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className="space-y-3">
            <Button 
              onClick={checkCompany} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Verificando...' : 'Verificar Empresa'}
            </Button>

            <Button 
              onClick={createCompany} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Criando...' : 'Criar/Atualizar Empresa Pablo'}
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={testLink} 
                variant="outline"
                disabled={!companyExists}
              >
                Testar Link Público
              </Button>

              <Button 
                onClick={testDebugLink} 
                variant="outline"
              >
                Página de Debug
              </Button>
            </div>
          </div>

          {/* Links */}
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Link público:</strong></p>
            <p className="font-mono bg-gray-100 p-2 rounded">http://localhost:8081/pablo</p>
            <p><strong>Link de debug:</strong></p>
            <p className="font-mono bg-gray-100 p-2 rounded">http://localhost:8081/debug/pablo</p>
          </div>

          {/* Instruções */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Instruções</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>1. Clique em "Verificar Empresa" para ver se a empresa existe</p>
              <p>2. Se não existir, clique em "Criar/Atualizar Empresa Pablo"</p>
              <p>3. Após criar, teste o "Link Público"</p>
              <p>4. Se houver problemas, use a "Página de Debug" para diagnóstico</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default FixPabloLink;