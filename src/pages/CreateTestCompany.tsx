import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CreateTestCompany = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createTestCompany = async () => {
    setLoading(true);
    try {
      // Verificar se já existe uma empresa com slug 'pablo'
      const { data: existingCompany } = await supabase
        .from('company_settings')
        .select('slug')
        .eq('slug', 'pablo')
        .maybeSingle();

      if (existingCompany) {
        toast({
          title: "Empresa já existe",
          description: "A empresa de teste 'pablo' já foi criada!",
        });
        return;
      }

      toast({
        title: "Funcionalidade Simplificada",
        description: "Use a interface normal para criar empresas. Esta página é apenas para testes de desenvolvimento.",
      });
      
    } catch (error) {
      console.error('❌ Erro geral:', error);
      toast({
        title: "Erro",
        description: `Erro inesperado: ${error}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const { data: companies, error } = await supabase
        .from('company_settings')
        .select('slug, company_name')
        .limit(10);
      
      if (error) {
        toast({
          title: "Erro de Conexão",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Conexão OK",
          description: `Encontradas ${companies?.length || 0} empresas no banco`,
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

  const testPublicLink = () => {
    // Usar a URL atual do ambiente
    const currentUrl = window.location.origin;
    window.open(`${currentUrl}/pablo`, '_blank');
  };

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Criar Empresa de Teste</CardTitle>
          <CardDescription>
            Crie uma empresa de teste com slug "pablo" para testar o link público
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testConnection} 
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Testando...' : 'Testar Conexão'}
          </Button>
          
          <Button 
            onClick={createTestCompany} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Criando...' : 'Criar Empresa "pablo"'}
          </Button>
          
          <Button 
            onClick={testPublicLink} 
            variant="outline"
            className="w-full"
          >
            Testar Link Público
          </Button>
          
          <div className="text-sm text-gray-600">
            <p><strong>Link público de teste:</strong></p>
            <p>{window.location.origin}/pablo</p>
            <p className="mt-2 text-xs text-gray-500">
              Nota: Esta página é para desenvolvimento. Use a interface normal para criar empresas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateTestCompany;