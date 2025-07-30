import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { loadCompanyDataBySlug } from '@/services/publicBookingService';

const DebugPublicBooking = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    setLoading(true);
    const debug: any = {
      timestamp: new Date().toISOString(),
      slug: companySlug,
      url: window.location.href,
      pathname: window.location.pathname,
    };

    try {
      // 1. Testar conexão básica
      console.log('🔍 Testando conexão básica...');
      const { data: testConnection, error: connectionError } = await supabase
        .from('company_settings')
        .select('count')
        .limit(1);
      
      debug.connection = {
        success: !connectionError,
        error: connectionError?.message,
        result: testConnection
      };

      // 2. Buscar todas as empresas
      console.log('🔍 Buscando todas as empresas...');
      const { data: allCompanies, error: allError } = await supabase
        .from('company_settings')
        .select('slug, company_id, working_hours_start, working_hours_end')
        .limit(10);
      
      debug.allCompanies = {
        success: !allError,
        error: allError?.message,
        count: allCompanies?.length || 0,
        companies: allCompanies || []
      };

      // 3. Buscar empresa específica
      if (companySlug) {
        console.log('🔍 Buscando empresa específica:', companySlug);
        const { data: specificCompany, error: specificError } = await supabase
          .from('company_settings')
          .select('*')
          .eq('slug', companySlug)
          .maybeSingle();
        
        debug.specificCompany = {
          success: !specificError,
          error: specificError?.message,
          found: !!specificCompany,
          data: specificCompany
        };

        // 4. Testar serviço completo
        if (specificCompany) {
          try {
            console.log('🔍 Testando serviço completo...');
            const serviceResult = await loadCompanyDataBySlug(companySlug);
            debug.serviceTest = {
              success: true,
              data: serviceResult
            };
          } catch (serviceError: any) {
            debug.serviceTest = {
              success: false,
              error: serviceError.message
            };
          }
        }
      }

      // 5. Informações do ambiente
      debug.environment = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        online: navigator.onLine,
        cookieEnabled: navigator.cookieEnabled
      };

    } catch (error: any) {
      debug.generalError = error.message;
    }

    setDebugInfo(debug);
    setLoading(false);
  };

  useEffect(() => {
    runDebug();
  }, [companySlug]);

  const createTestCompany = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .upsert({
          company_id: '550e8400-e29b-41d4-a716-446655440000',
          slug: companySlug || 'pablo',
          working_days: [1, 2, 3, 4, 5, 6],
          working_hours_start: '09:00:00',
          working_hours_end: '18:00:00',
          appointment_interval: 30,
          max_simultaneous_appointments: 1,
          advance_booking_limit: 30,
          theme_color: '#22c55e',
          welcome_message: `Bem-vindo à empresa ${companySlug}!`
        }, {
          onConflict: 'slug'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar empresa:', error);
      } else {
        console.log('Empresa criada:', data);
        runDebug(); // Reexecutar debug
      }
    } catch (error) {
      console.error('Erro geral:', error);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Debug - Link Público de Agendamento</CardTitle>
          <CardDescription>
            Diagnóstico completo para o slug: <Badge variant="outline">{companySlug || 'não definido'}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Button onClick={runDebug} disabled={loading}>
              {loading ? 'Executando...' : 'Executar Debug'}
            </Button>
            <Button onClick={createTestCompany} disabled={loading} variant="outline">
              Criar Empresa de Teste
            </Button>
          </div>

          {debugInfo.timestamp && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Informações básicas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Informações Básicas</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1">
                    <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
                    <p><strong>Slug:</strong> {debugInfo.slug || 'não definido'}</p>
                    <p><strong>URL:</strong> {debugInfo.url}</p>
                    <p><strong>Pathname:</strong> {debugInfo.pathname}</p>
                  </CardContent>
                </Card>

                {/* Conexão */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Conexão com Banco</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs">
                    <Badge variant={debugInfo.connection?.success ? "default" : "destructive"}>
                      {debugInfo.connection?.success ? 'Conectado' : 'Erro'}
                    </Badge>
                    {debugInfo.connection?.error && (
                      <p className="text-red-600 mt-1">{debugInfo.connection.error}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Todas as empresas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Empresas no Banco</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs">
                    <Badge variant={debugInfo.allCompanies?.success ? "default" : "destructive"}>
                      {debugInfo.allCompanies?.count || 0} empresas encontradas
                    </Badge>
                    {debugInfo.allCompanies?.companies && (
                      <div className="mt-2 space-y-1">
                        {debugInfo.allCompanies.companies.map((company: any, index: number) => (
                          <p key={index} className="text-xs">
                            <strong>{company.slug}</strong> ({company.company_id.substring(0, 8)}...)
                          </p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Empresa específica */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Empresa Específica</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs">
                    <Badge variant={debugInfo.specificCompany?.found ? "default" : "destructive"}>
                      {debugInfo.specificCompany?.found ? 'Encontrada' : 'Não encontrada'}
                    </Badge>
                    {debugInfo.specificCompany?.error && (
                      <p className="text-red-600 mt-1">{debugInfo.specificCompany.error}</p>
                    )}
                    {debugInfo.specificCompany?.data && (
                      <div className="mt-2">
                        <p><strong>ID:</strong> {debugInfo.specificCompany.data.company_id}</p>
                        <p><strong>Horário:</strong> {debugInfo.specificCompany.data.working_hours_start} - {debugInfo.specificCompany.data.working_hours_end}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Teste do serviço */}
              {debugInfo.serviceTest && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Teste do Serviço Completo</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs">
                    <Badge variant={debugInfo.serviceTest.success ? "default" : "destructive"}>
                      {debugInfo.serviceTest.success ? 'Sucesso' : 'Erro'}
                    </Badge>
                    {debugInfo.serviceTest.error && (
                      <p className="text-red-600 mt-1">{debugInfo.serviceTest.error}</p>
                    )}
                    {debugInfo.serviceTest.data && (
                      <div className="mt-2">
                        <p><strong>Perfil:</strong> {debugInfo.serviceTest.data.profileData?.company_name || 'N/A'}</p>
                        <p><strong>Serviços:</strong> {debugInfo.serviceTest.data.servicesData?.length || 0}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* JSON completo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Debug Completo (JSON)</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-96">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugPublicBooking;