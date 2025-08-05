import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, Monitor, Eye, ExternalLink } from 'lucide-react';
import PublicThemeCustomizer from '@/components/settings/PublicThemeCustomizer';

const ThemeTestPage = () => {
  const [testSlug] = useState('empresa-teste');

  const openPublicPage = () => {
    window.open(`/public/${testSlug}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Teste de Separação de Temas</h1>
          <p className="text-gray-600">
            Validação da aplicação correta de temas: Dashboard (fixo) vs Área Pública (personalizável)
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dashboard Status */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Monitor className="w-5 h-5" />
                Dashboard Administrativo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                  Tema Fixo do Sistema
                </Badge>
                <p className="text-sm text-gray-600">
                  Esta área (dashboard) deve SEMPRE manter o tema padrão, 
                  independente das configurações de personalização.
                </p>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Cor Principal:</strong> #19c662 (Verde WhatsApp)
                  </p>
                  <p className="text-xs text-blue-800">
                    <strong>Modo:</strong> Sempre claro
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Public Area Status */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Palette className="w-5 h-5" />
                Área Pública
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                  Tema Personalizável
                </Badge>
                <p className="text-sm text-gray-600">
                  A área pública reflete as configurações de personalização 
                  definidas pelo comerciante.
                </p>
                <Button
                  onClick={openPublicPage}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir Área Pública
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Theme Customizer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <PublicThemeCustomizer />
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Como Testar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">1. Alterar Tema</h4>
                  <p className="text-sm text-gray-600">
                    Use o painel ao lado para alterar cor e modo (claro/escuro)
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">2. Verificar Dashboard</h4>
                  <p className="text-sm text-gray-600">
                    Esta página deve PERMANECER com tema padrão (verde WhatsApp)
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">3. Verificar Área Pública</h4>
                  <p className="text-sm text-gray-600">
                    Clique em "Abrir Área Pública" para ver as mudanças aplicadas
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    <strong>Resultado Esperado:</strong> Dashboard inalterado, 
                    área pública com tema personalizado.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Validation Checklist */}
            <Card>
              <CardHeader>
                <CardTitle>Checklist de Validação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="check1" />
                    <label htmlFor="check1">Dashboard mantém tema verde padrão</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="check2" />
                    <label htmlFor="check2">Área pública reflete cor selecionada</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="check3" />
                    <label htmlFor="check3">Dark/Light mode funciona apenas na área pública</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="check4" />
                    <label htmlFor="check4">Mudanças são aplicadas imediatamente</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="check5" />
                    <label htmlFor="check5">Configurações são salvas no banco</label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeTestPage;