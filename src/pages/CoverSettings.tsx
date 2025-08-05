import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import CoverImageSettings from '@/components/settings/CoverImageSettings';
import { useCompanySettings } from '@/hooks/useCompanySettings';

const CoverSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { companyBasicData } = useCompanySettings();

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSaveCover = (coverUrl: string) => {
    console.log('Salvando foto de capa:', coverUrl);
    // Aqui você implementaria a lógica para salvar no banco
    // Por exemplo, atualizar company_settings com cover_image_url
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-whatsapp-green" />
                Configurações de Capa
              </h1>
              <p className="text-sm text-gray-600">Configure a aparência da sua página pública</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <CoverImageSettings
          companyName={companyBasicData.name || 'Sua Empresa'}
          businessType=""
          address={companyBasicData.address}
          logoUrl=""
          currentCoverUrl=""
          onSave={handleSaveCover}
        />

        {/* Informações adicionais */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Como funciona?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">📸 Foto de Capa</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Ocupa a metade superior do cabeçalho</li>
                <li>• Resolução recomendada: 1200x400px</li>
                <li>• Formatos: JPG, PNG, WebP</li>
                <li>• Tamanho máximo: 5MB</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">👤 Foto de Perfil</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Fica sobreposta à capa (efeito 3D)</li>
                <li>• 50% sobre a capa + 50% fora</li>
                <li>• Sombra dinâmica por tema</li>
                <li>• Formato circular automático</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Preview da página pública */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">🌐 Visualizar Página Pública</h3>
          <p className="text-gray-600 mb-4">
            Veja como suas alterações ficam na página que seus clientes veem:
          </p>
          <Button
            onClick={() => window.open('/public/preview', '_blank')}
            className="bg-whatsapp-green hover:bg-green-600"
          >
            Abrir Preview da Página Pública
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CoverSettings;