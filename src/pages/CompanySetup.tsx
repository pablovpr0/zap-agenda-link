
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Store } from 'lucide-react';
import { fetchProfile, upsertProfile } from '@/services/profileService';
import { createDefaultSettings } from '@/services/companySettingsService';

const CompanySetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      console.log('No user found, redirecting to auth');
      navigate('/auth');
      return;
    }

    // Check if profile already exists and is complete
    const checkExistingProfile = async () => {
      try {
        console.log('Checking existing profile for user:', user.id);
        setCheckingProfile(true);
        
        const profile = await fetchProfile(user.id);
        console.log('Profile found:', profile);
        
        if (profile?.company_name && profile.company_name.trim()) {
          // Profile is already complete, redirect to main app
          console.log('Profile is complete, redirecting to main app');
          navigate('/');
          return;
        }
        
        // Profile exists but incomplete, pre-fill form if possible
        if (profile) {
          if (profile.company_name) setCompanyName(profile.company_name);
          if (profile.business_type) setBusinessType(profile.business_type);
        }
        
      } catch (error) {
        console.error('Error checking profile:', error);
        // Continue with setup if profile doesn't exist or there's an error
      } finally {
        setCheckingProfile(false);
      }
    };

    checkExistingProfile();
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !companyName.trim()) {
      toast({
        title: "Nome da empresa obrigatório",
        description: "Por favor, preencha o nome da empresa.",
        variant: "destructive",
      });
      return;
    }

    if (loading) return; // Prevent double submission

    setLoading(true);

    try {
      console.log('Starting company setup process for user:', user.id);
      console.log('Company name:', companyName.trim());
      console.log('Business type:', businessType.trim());
      
      // Step 1: Create or update the profile
      const profileData = {
        company_name: companyName.trim(),
        business_type: businessType.trim() || null,
      };

      console.log('Attempting to save profile with data:', profileData);
      const profile = await upsertProfile(user.id, profileData);
      console.log('Profile saved successfully:', profile);

      // Step 2: Create default company settings (non-blocking)
      try {
        console.log('Creating default company settings...');
        await createDefaultSettings(user.id, companyName.trim());
        console.log('Default settings created successfully');
      } catch (settingsError: any) {
        console.error('Error creating default settings (non-blocking):', settingsError);
        // Don't fail the whole process if settings creation fails
        toast({
          title: "Parcialmente configurado",
          description: "Empresa criada, mas algumas configurações padrão serão definidas depois.",
          variant: "default",
        });
      }

      toast({
        title: "Empresa configurada com sucesso!",
        description: "Agora você pode começar a usar o ZapAgenda!",
      });

      // Small delay to ensure data is persisted before navigation
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 800);

    } catch (error: any) {
      console.error('Error in company setup:', error);
      
      let errorMessage = "Não foi possível configurar a empresa. Tente novamente.";
      
      if (error.message && typeof error.message === 'string') {
        errorMessage = error.message;
      }

      toast({
        title: "Erro ao configurar empresa",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">Configure sua Empresa</CardTitle>
          <p className="text-gray-600">Vamos começar configurando as informações básicas da sua empresa</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nome da Empresa *</Label>
              <Input
                id="company-name"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Salão Beleza & Estilo"
                required
                disabled={loading}
                maxLength={100}
              />
              <p className="text-xs text-gray-500">
                Este nome aparecerá na sua página de agendamentos
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-type">Tipo de Negócio</Label>
              <Input
                id="business-type"
                type="text"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                placeholder="Ex: Salão de Beleza, Barbearia, Clínica"
                disabled={loading}
                maxLength={50}
              />
              <p className="text-xs text-gray-500">
                Opcional - ajuda a personalizar sua experiência
              </p>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={loading || !companyName.trim()}
                size="lg"
              >
                {loading ? "Configurando..." : "Continuar"}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Você poderá alterar essas informações depois nas configurações
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanySetup;
