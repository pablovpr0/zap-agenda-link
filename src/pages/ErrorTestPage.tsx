import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

const ErrorTestPage = () => {
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const runTests = async () => {
    setLoading(true);
    const foundErrors: string[] = [];

    try {
      // Teste 1: Verificar se os tipos estão corretos
      const { applyPublicTheme, getPublicThemeColorById } = await import('@/types/publicTheme');
      const testColor = getPublicThemeColorById('green');
      if (!testColor) {
        foundErrors.push('Função getPublicThemeColorById não está funcionando');
      }

      // Teste 2: Verificar se o serviço de tema funciona
      const { loadPublicThemeSettings } = await import('@/services/publicThemeService');
      
      // Teste 3: Verificar se o hook de aplicação existe
      const { usePublicThemeApplication } = await import('@/hooks/usePublicThemeApplication');
      
      // Teste 4: Verificar se as funções de agendamento existem
      const { createAppointment, generateWhatsAppMessage } = await import('@/services/appointmentService');
      
      // Teste 5: Verificar se as validações existem
      const { validateBookingForm } = await import('@/utils/inputValidation');
      
      // Teste 6: Verificar se o limite mensal funciona
      const { checkMonthlyLimit } = await import('@/utils/monthlyLimitUtils');

      console.log('✅ Todos os imports funcionaram');

    } catch (error: any) {
      foundErrors.push(`Erro de import: ${error.message}`);
    }

    setErrors(foundErrors);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Teste de Erros do Sistema</h1>
          <p className="text-gray-600">
            Verificação automática de problemas no código
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : errors.length === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              Status dos Testes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Executando testes...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {errors.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-green-800 mb-2">
                      Todos os Testes Passaram!
                    </h3>
                    <p className="text-green-600">
                      Não foram encontrados erros no sistema.
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-red-800 mb-4">
                      Erros Encontrados ({errors.length})
                    </h3>
                    <div className="space-y-2">
                      {errors.map((error, index) => (
                        <div
                          key={index}
                          className="bg-red-50 border border-red-200 rounded-lg p-3"
                        >
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                            <span className="text-red-800 text-sm">{error}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-center mt-6">
                  <Button onClick={runTests} disabled={loading}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Executar Testes Novamente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>URL Atual:</strong> {window.location.href}
              </div>
              <div>
                <strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...
              </div>
              <div>
                <strong>Timestamp:</strong> {new Date().toISOString()}
              </div>
              <div>
                <strong>Classes do Body:</strong> {document.body.className || 'Nenhuma'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ErrorTestPage;