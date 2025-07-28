import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Camera, Upload, Palette } from 'lucide-react';
import { getStorageData, setStorageData, MockProfile, STORAGE_KEYS } from '@/data/mockData';

interface ProfileCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ProfileCustomizationModal = ({ isOpen, onClose, onSuccess }: ProfileCustomizationModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadProfileData();
    }
  }, [isOpen, user]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const profileData = getStorageData<MockProfile>(STORAGE_KEYS.PROFILE, null);
      if (profileData) {
        setCompanyName(profileData.company_name);
        setCompanyDescription(profileData.company_description || '');
        setCompanyLogoUrl(profileData.company_logo || '');
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);

    try {
      // In a real application, you would upload the image to a storage service
      // and get the URL from there. For this example, we'll use a placeholder.
      setCompanyLogoUrl('https://via.placeholder.com/150'); // Placeholder URL
      setCompanyLogo(file);

      toast({
        title: "Logo enviado com sucesso!",
        description: "O logo da empresa foi atualizado.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar logo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName) {
      toast({
        title: "Nome da empresa obrigatório",
        description: "Por favor, preencha o nome da empresa.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const updatedProfile: MockProfile = {
        id: user?.id || 'user-1',
        company_name: companyName,
        company_description: companyDescription,
        company_logo: companyLogoUrl,
      };

      setStorageData(STORAGE_KEYS.PROFILE, updatedProfile);

      toast({
        title: "Perfil atualizado com sucesso!",
        description: "As informações do perfil foram atualizadas.",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-whatsapp-green" />
            Personalizar Perfil
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Logo */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                {companyLogoUrl ? (
                  <img
                    src={companyLogoUrl}
                    alt="Company Logo"
                    className="w-24 h-24 rounded-full object-cover border-4 border-green-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-green-100 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-green-600 rounded-full p-2 cursor-pointer hover:bg-green-700 transition-colors">
                  <Upload className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500 text-center">
                {uploading ? "Enviando..." : "Clique para alterar o logo"}
              </p>
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="company-name">Nome da Empresa</Label>
              <Input
                id="company-name"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Digite o nome da sua empresa"
              />
            </div>

            {/* Company Description */}
            <div className="space-y-2">
              <Label htmlFor="company-description">Descrição da Empresa</Label>
              <Textarea
                id="company-description"
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                placeholder="Escreva uma breve descrição da sua empresa"
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-whatsapp-green hover:bg-green-600"
              >
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCustomizationModal;
