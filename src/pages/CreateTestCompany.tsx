import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { testDatabaseConnection, createMinimalTestData } from '@/utils/testDatabase';

const CreateTestCompany = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createTestCompany = async () => {
    setLoading(true);
    try {
      const result = await createMinimalTestData();
      
      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Empresa de teste 'pablo' criada com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: `Erro ao criar empresa: ${result.error?.message}`,
          variant: "destructive",
        });
      }
      
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
      const result = await testDatabaseConnection();
      
      if (result.success) {
        toast({
          title: "Conexão OK",
          description: `Encontradas ${result.data?.length || 0} empresas no banco`,
        });
      } else {
        toast({
          title: "Erro de Conexão",
          description: `${result.error?.message}`,
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

  const testPublicLink = () => {
    window.open('http://localhost:8081/pablo', '_blank');
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
            <p><strong>Link público:</strong></p>
            <p>http://localhost:8081/pablo</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateTestCompany;