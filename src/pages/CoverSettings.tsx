import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CoverImageSettings from '@/components/settings/CoverImageSettings';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';
const CoverSettings = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    companyBasicData
  } = useCompanySettings();
  const [currentCoverUrl, setCurrentCoverUrl] = React.useState<string>('');

  // Carregar foto de capa atual
  React.useEffect(() => {
    const loadCurrentCover = async () => {
      if (!user?.id) return;
      try {
        const {
          data,
          error
        } = await supabase.from('company_settings').select('cover_image_url').eq('company_id', user.id).single();
        if (error) {
          devError('Erro ao carregar foto de capa atual:', error);
          return;
        }
        if (data?.cover_image_url) {
          setCurrentCoverUrl(data.cover_image_url);
        }
      } catch (error) {
        devError('Erro ao carregar foto de capa:', error);
      }
    };
    loadCurrentCover();
  }, [user?.id]);
  if (!user) {
    navigate('/auth');
    return null;
  }
  const handleSaveCover = async (coverUrl: string) => {
    devLog('Salvando foto de capa:', coverUrl);
    try {
      const {
        error
      } = await supabase.from('company_settings').update({
        cover_image_url: coverUrl
      }).eq('company_id', user!.id);
      if (error) {
        devError('Erro ao salvar foto de capa:', error);
        toast({
          title: "Erro",
          description: "Não foi possível salvar a foto de capa.",
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "Foto de capa salva!",
        description: "A foto de capa foi atualizada com sucesso."
      });

      // Disparar evento para atualizar outros componentes
      window.dispatchEvent(new CustomEvent('coverImageUpdated'));
    } catch (error: unknown) {
      devError('Erro ao salvar foto de capa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a foto de capa.",
        variant: "destructive"
      });
    }
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
        <CoverImageSettings companyName={companyBasicData.name || 'Sua Empresa'} businessType="" address={companyBasicData.address} logoUrl="" currentCoverUrl={currentCoverUrl} onSave={handleSaveCover} />

        {/* Informações adicionais */}
        

        {/* Preview da página pública */}
        
      </div>
    </div>;
};
export default CoverSettings;