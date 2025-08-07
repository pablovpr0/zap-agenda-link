import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Palette } from 'lucide-react';
import PublicThemeCustomizer from '@/components/settings/PublicThemeCustomizer';
const ThemeCustomization = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  if (!user) {
    navigate('/auth');
    return null;
  }
  const handleSaveTheme = (settings: any) => {
    console.log('Tema salvo:', settings);
    // Callback já é tratado pelo PublicThemeCustomizer
  };
  return <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Palette className="w-5 h-5 text-whatsapp-green" />
                Personalização Avançada de Tema
              </h1>
              <p className="text-sm text-gray-600">Configure cores, modo escuro e aparência da página pública</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <PublicThemeCustomizer onSave={handleSaveTheme} />

        {/* Informações adicionais */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          

          
        </div>

        {/* Preview da página pública */}
        

        {/* Dicas importantes */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-amber-800">💡 Dicas Importantes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-amber-800 mb-2">🎯 Escolha da Cor</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Use cores que representem sua marca</li>
                <li>• Considere o tipo de negócio</li>
                <li>• Teste em diferentes dispositivos</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-amber-800 mb-2">🌓 Modo Escuro</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Ideal para salões noturnos</li>
                <li>• Reduz cansaço visual</li>
                <li>• Aparência mais moderna</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default ThemeCustomization;