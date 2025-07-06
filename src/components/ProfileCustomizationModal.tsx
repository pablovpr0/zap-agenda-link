
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ImageUpload from './ImageUpload';
import { Save } from 'lucide-react';

interface ProfileCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ProfileCustomizationModal = ({ isOpen, onClose, onSuccess }: ProfileCustomizationModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      loadProfileData();
    }
  }, [isOpen, user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      // Buscar dados do perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name')
        .eq('id', user.id)
        .single();

      // Buscar configurações da empresa
      const { data: settings } = await supabase
        .from('company_settings')
        .select('welcome_message, instagram_url, logo_url, cover_image_url')
        .eq('company_id', user.id)
        .single();

      if (profile) {
        setCompanyName(profile.company_name || '');
      }

      if (settings) {
        setWelcomeMessage(settings.welcome_message || '');
        setInstagramUrl(settings.instagram_url || '');
        setLogoUrl(settings.logo_url || '');
        setCoverImageUrl(settings.cover_image_url || '');
      }

    } catch (error: any) {
      console.error('Erro ao carregar dados do perfil:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Atualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          company_name: companyName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Atualizar configurações da empresa
      const { error: settingsError } = await supabase
        .from('company_settings')
        .update({
          welcome_message: welcomeMessage,
          instagram_url: instagramUrl,
          logo_url: logoUrl,
          cover_image_url: coverImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('company_id', user.id);

      if (settingsError) throw settingsError;

      toast({
        title: "Perfil atualizado!",
        description: "As informações do seu perfil foram salvas com sucesso.",
      });

      onSuccess?.();
      onClose();

    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            Personalizar Perfil da Empresa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nome da Empresa */}
          <div className="space-y-2">
            <Label htmlFor="companyName">Nome da Empresa</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Digite o nome da sua empresa"
            />
          </div>

          {/* Logo da Empresa */}
          <div className="space-y-2">
            <Label>Logo da Empresa</Label>
            <ImageUpload
              bucket="company-logos"
              currentImageUrl={logoUrl}
              onImageUploaded={setLogoUrl}
              placeholder="Clique para adicionar o logo"
              maxSizeMB={2}
            />
          </div>

          {/* Imagem de Capa */}
          <div className="space-y-2">
            <Label>Imagem de Capa</Label>
            <ImageUpload
              bucket="company-covers"
              currentImageUrl={coverImageUrl}
              onImageUploaded={setCoverImageUrl}
              placeholder="Clique para adicionar uma capa"
              maxSizeMB={5}
            />
          </div>

          {/* Mensagem de Boas-vindas */}
          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">Mensagem de Boas-vindas</Label>
            <Textarea
              id="welcomeMessage"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Digite uma mensagem de boas-vindas para seus clientes"
              rows={3}
            />
          </div>

          {/* Instagram URL */}
          <div className="space-y-2">
            <Label htmlFor="instagramUrl">Link do Instagram (opcional)</Label>
            <Input
              id="instagramUrl"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/suaempresa"
              type="url"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-whatsapp-green hover:bg-whatsapp-green/90"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </div>
            ) : (
              <div className="flex items-center">
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCustomizationModal;
