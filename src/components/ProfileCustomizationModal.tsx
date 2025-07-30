
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { User, Palette, Upload, Link, Settings, Users } from 'lucide-react';
import ImageUpload from './ImageUpload';
import ThemeSelector from './ThemeSelector';

interface ProfileCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ProfileCustomizationModal = ({ isOpen, onClose, onSuccess }: ProfileCustomizationModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [themeColor, setThemeColor] = useState('#22c55e');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState(4);

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
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      if (profile) {
        setCompanyName(profile.company_name || '');
        setBusinessType(profile.business_type || '');
      }

      // Load company settings
      const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

      if (settings) {
        setLogoUrl(settings.logo_url || '');
        setThemeColor(settings.theme_color || '#22c55e');
        setSelectedThemeId(settings.selected_theme_id || '');
        setWelcomeMessage(settings.welcome_message || '');
        setInstagramUrl(settings.instagram_url || '');
        setAddress(settings.address || '');
        setPhone(settings.phone || '');
        setMonthlyLimit(settings.monthly_appointments_limit || 4);
      }

    } catch (error: any) {
      console.error('Erro ao carregar dados do perfil:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do perfil.",
        variant: "destructive",
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
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user!.id,
          company_name: companyName,
          business_type: businessType || null,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      // Create slug from company name
      const companySlug = companyName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Check if company settings already exist
      const { data: existingSettings, error: checkError } = await supabase
        .from('company_settings')
        .select('id')
        .eq('company_id', user!.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      const settingsData = {
        company_id: user!.id,
        slug: companySlug,
        logo_url: logoUrl || null,
        theme_color: themeColor,
        selected_theme_id: selectedThemeId || null,
        welcome_message: welcomeMessage || null,
        instagram_url: instagramUrl || null,
        address: address || null,
        phone: phone || null,
        monthly_appointments_limit: monthlyLimit,
        updated_at: new Date().toISOString(),
      };

      if (existingSettings) {
        // Update existing settings
        const { error: settingsError } = await supabase
          .from('company_settings')
          .update(settingsData)
          .eq('company_id', user!.id);

        if (settingsError) throw settingsError;
      } else {
        // Create new settings with required fields
        const { error: settingsError } = await supabase
          .from('company_settings')
          .insert({
            ...settingsData,
            // Campos obrigatórios com valores padrão
            working_days: [1, 2, 3, 4, 5, 6],
            working_hours_start: '09:00',
            working_hours_end: '18:00',
            appointment_interval: 30,
            max_simultaneous_appointments: 1,
            advance_booking_limit: 30,
          });

        if (settingsError) throw settingsError;
      }

      toast({
        title: "Perfil atualizado!",
        description: "As informações foram salvas com sucesso.",
      });

      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o perfil. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-whatsapp-green" />
            Personalizar Perfil da Empresa
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações Básicas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa *</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: Salão Beleza & Estilo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType">Tipo de Negócio</Label>
                  <Input
                    id="businessType"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    placeholder="Ex: Salão de Beleza, Barbearia, Clínica"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua das Flores, 123 - Centro - Cidade/UF"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone WhatsApp</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
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
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Logo da Empresa (Foto de Perfil)
                  </Label>
                  <ImageUpload
                    currentImageUrl={logoUrl}
                    onImageUploaded={setLogoUrl}
                    bucket="company-logos"
                  />
                  <p className="text-xs text-gray-500">
                    A logo será exibida em formato arredondado e tamanho grande
                  </p>
                </div>

                {/* Seletor de Temas */}
                <div className="space-y-2">
                  <ThemeSelector 
                    onThemeChange={(theme) => {
                      setThemeColor(theme.colors.primary);
                      setSelectedThemeId(theme.id);
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    O tema selecionado será aplicado na página pública de agendamento dos seus clientes
                  </p>
                </div>
              </div>
            </div>

            {/* Mensagens e Configurações */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Link className="w-5 h-5" />
                Mensagens e Links
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage">Mensagem de Boas-vindas</Label>
                  <Input
                    id="welcomeMessage"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Ex: Seja bem-vindo! Agende seu horário conosco."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagramUrl">Link do Instagram</Label>
                  <Input
                    id="instagramUrl"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/seuusuario"
                  />
                </div>
              </div>
            </div>

            {/* Configurações de Agendamento */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Configurações de Agendamento
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyLimit">Limite de Agendamentos por Cliente/Mês</Label>
                  <Input
                    id="monthlyLimit"
                    type="number"
                    min="1"
                    max="50"
                    value={monthlyLimit}
                    onChange={(e) => setMonthlyLimit(Number(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">
                    Defina quantos agendamentos cada cliente pode fazer por mês (identificado pelo telefone)
                  </p>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-whatsapp-green hover:bg-green-600"
              >
                {submitting ? "Salvando..." : "Salvar Perfil"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCustomizationModal;
