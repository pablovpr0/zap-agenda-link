import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { User, Palette, Upload, Settings } from 'lucide-react';
import ImageUpload from './ImageUpload';
interface ProfileCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
const ProfileCustomizationModal = ({
  isOpen,
  onClose,
  onSuccess
}: ProfileCustomizationModalProps) => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  useEffect(() => {
    if (isOpen && user) {
      loadProfileData();
    }
  }, [isOpen, user]);
  const loadProfileData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Load profile data
      const {
        data: profile,
        error: profileError
      } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      if (profile) {
        setCompanyName(profile.company_name || '');
        setBusinessType(profile.business_type || '');
      }

      // Load company settings
      const {
        data: settings,
        error: settingsError
      } = await supabase.from('company_settings').select('*').eq('company_id', user.id).single();
      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;
      if (settings) {
        setLogoUrl(settings.logo_url || '');
        setAddress((settings as any).address || '');
        setPhone((settings as any).phone || '');
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados do perfil:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do perfil.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome da empresa.",
        variant: "destructive"
      });
      return;
    }
    setSubmitting(true);
    try {
      // Update profile
      const {
        error: profileError
      } = await supabase.from('profiles').upsert({
        id: user!.id,
        company_name: companyName,
        business_type: businessType || null,
        updated_at: new Date().toISOString()
      });
      if (profileError) throw profileError;

      // Create slug from company name
      const companySlug = companyName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

      // Check if company settings already exist
      const {
        data: existingSettings,
        error: checkError
      } = await supabase.from('company_settings').select('id').eq('company_id', user!.id).single();
      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      const settingsData = {
        company_id: user!.id,
        slug: companySlug,
        logo_url: logoUrl || null,
        address: address || null,
        phone: phone || null,
        updated_at: new Date().toISOString()
      };
      if (existingSettings) {
        // Update existing settings
        const {
          error: settingsError
        } = await supabase.from('company_settings').update(settingsData).eq('company_id', user!.id);
        if (settingsError) throw settingsError;
      } else {
        // Create new settings with required fields
        const {
          error: settingsError
        } = await supabase.from('company_settings').insert({
          ...settingsData,
          // Campos obrigatórios com valores padrão
          working_days: [1, 2, 3, 4, 5, 6],
          working_hours_start: '09:00',
          working_hours_end: '18:00',
          appointment_interval: 30,
          max_simultaneous_appointments: 1,
          advance_booking_limit: 30
        });
        if (settingsError) throw settingsError;
      }
      toast({
        title: "Perfil atualizado!",
        description: "As informações foram salvas com sucesso."
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o perfil. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-whatsapp-green" />
            Personalizar Perfil da Empresa
          </DialogTitle>
        </DialogHeader>

        {loading ? <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
          </div> : <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações Básicas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa *</Label>
                  <Input id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ex: Salão Beleza & Estilo" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType">Tipo de Negócio</Label>
                  <Input id="businessType" value={businessType} onChange={e => setBusinessType(e.target.value)} placeholder="Ex: Salão de Beleza, Barbearia, Clínica" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua das Flores, 123 - Centro - Cidade/UF" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone WhatsApp</Label>
                  <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
                </div>
              </div>
            </div>

            {/* Visual */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Personalização Visual
              </h3>

              <div className="space-y-4">
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Logo da Empresa (Foto de Perfil)
                  </Label>
                  
                  {/* Upload da Logo */}
                  <ImageUpload currentImageUrl={logoUrl} onImageUploaded={setLogoUrl} bucket="company-logos" />
                  
                  {/* Preview da Logo na Página Pública */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">Preview: Como ficará na página pública</Label>
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      {/* Simulação do cabeçalho da página pública */}
                      <div className="text-center space-y-3">
                        {/* Logo Preview */}
                        <div className="flex justify-center">
                          <div className="relative">
                            <div className="w-[80px] h-[80px] rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                              {logoUrl ? <img src={logoUrl} alt="Preview da logo" className="w-full h-full object-cover" onError={e => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }} /> : <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Upload className="w-6 h-6" />
                                </div>}
                            </div>
                            {/* Sombra 3D simulada */}
                            <div className="absolute inset-0 rounded-full shadow-xl pointer-events-none opacity-30"></div>
                          </div>
                        </div>
                        
                        {/* Informações da empresa */}
                        <div>
                          <h4 className="font-semibold text-gray-800 text-sm">
                            {companyName || 'Nome da Empresa'}
                          </h4>
                          {businessType && <p className="text-xs text-gray-600 mt-1">
                              {businessType}
                            </p>}
                          {address && <p className="text-xs text-gray-500 mt-1">
                              {address}
                            </p>}
                        </div>
                        
                        {/* Botão simulado */}
                        
                      </div>
                    </div>
                    
                    
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    💡 A logo será exibida em formato circular com sombra 3D na página pública
                  </p>
                </div>

                {/* Personalização Avançada */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                  <div className="text-center">
                    <Palette className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-blue-900 mb-2">
                      Personalização Completa da Página Pública
                    </h4>
                    <p className="text-sm text-blue-800 mb-4">
                      Configure cores dinâmicas, modo escuro/claro e foto de capa profissional 
                      para impressionar seus clientes.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="bg-white/60 rounded-lg p-3">
                        <h5 className="font-medium text-blue-900 text-sm mb-1">🎨 Tema Avançado</h5>
                        <p className="text-xs text-blue-700">6 cores • Modo escuro • Preview</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3">
                        <h5 className="font-medium text-blue-900 text-sm mb-1">📸 Foto de Capa</h5>
                        <p className="text-xs text-blue-700">Upload • Efeito 3D • Sombras</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 justify-center">
                      <Button type="button" variant="outline" size="sm" onClick={() => window.open('/theme-customization', '_blank')} className="border-blue-300 text-blue-700 hover:bg-blue-100">
                        🎨 Configurar Tema
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => window.open('/cover-settings', '_blank')} className="border-blue-300 text-blue-700 hover:bg-blue-100">
                        📸 Configurar Capa
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>



            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="bg-whatsapp-green hover:bg-green-600">
                {submitting ? "Salvando..." : "Salvar Perfil"}
              </Button>
            </div>
          </form>}
      </DialogContent>
    </Dialog>;
};
export default ProfileCustomizationModal;