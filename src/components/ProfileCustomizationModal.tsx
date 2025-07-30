
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Camera, Upload, Palette, AlertCircle } from 'lucide-react';
import { fetchProfile, updateProfile } from '@/services/profileService';

interface ProfileCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ProfileCustomizationModal = ({ isOpen, onClose, onSuccess }: ProfileCustomizationModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadProfileData();
    }
  }, [isOpen, user]);

  const loadProfileData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const profileData = await fetchProfile(user.id);
      if (profileData) {
        setCompanyName(profileData.company_name || '');
        setBusinessType(profileData.business_type || '');
        setProfileImageUrl(profileData.profile_image_url || '');
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      setError(error.message || 'Erro ao carregar dados do perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);

    try {
      // For now, we'll use a placeholder URL
      // In a real implementation, you would upload to Supabase Storage
      const placeholderUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(companyName || 'Company')}`;
      setProfileImageUrl(placeholderUrl);

      toast({
        title: "Imagem atualizada!",
        description: "A imagem do perfil foi atualizada.",
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erro ao enviar imagem",
        description: "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('Usuário não encontrado');
      return;
    }

    if (!companyName.trim()) {
      setError('Nome da empresa é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updateProfile(user.id, {
        company_name: companyName.trim(),
        business_type: businessType.trim() || null,
        profile_image_url: profileImageUrl || null,
      });

      toast({
        title: "Perfil atualizado com sucesso!",
        description: "As informações do perfil foram atualizadas.",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Erro ao salvar perfil');
      
      toast({
        title: "Erro ao salvar perfil",
        description: error.message || "Não foi possível salvar o perfil.",
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

        {loading && !error ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green mx-auto mb-2"></div>
              <p className="text-gray-600">Carregando dados do perfil...</p>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-800 font-medium">Erro</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Image */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt="Profile"
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
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading || loading}
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  {uploading ? "Enviando..." : "Clique para alterar a imagem"}
                </p>
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="company-name">Nome da Empresa *</Label>
                <Input
                  id="company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Digite o nome da sua empresa"
                  required
                  disabled={loading}
                  className={error ? 'border-red-300' : ''}
                />
              </div>

              {/* Business Type */}
              <div className="space-y-2">
                <Label htmlFor="business-type">Tipo de Negócio</Label>
                <Input
                  id="business-type"
                  type="text"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  placeholder="Ex: Salão de Beleza, Clínica, Barbearia"
                  disabled={loading}
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !companyName.trim()}
                  className="bg-whatsapp-green hover:bg-green-600"
                >
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCustomizationModal;
