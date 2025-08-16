
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Store, AlertCircle } from 'lucide-react';
import { fetchProfile, upsertProfile } from '@/services/profileService';
import { createDefaultSettings } from '@/services/companySettingsService';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

const CompanySetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      devLog('No user found, redirecting to auth');
      navigate('/auth');
      return;
    }

    checkExistingProfile();
  }, [user, isLoading, navigate]);

  const checkExistingProfile = async () => {
    if (!user) return;

    try {
      devLog('Checking existing profile for user:', user.id);
      setCheckingProfile(true);
      setError(null);
      
      const profile = await fetchProfile(user.id);
      devLog('Profile found:', profile);
      
      if (profile?.company_name && profile.company_name.trim()) {
        devLog('Profile is complete, redirecting to main app');
        navigate('/', { replace: true });
        return;
      }
      
      // Profile exists but incomplete, pre-fill form
      if (profile) {
        if (profile.company_name) setCompanyName(profile.company_name);
        if (profile.business_type) setBusinessType(profile.business_type);
      }
      
    } catch (error: unknown) {
      devError('Error checking profile:', error);
      setError('Erro ao verificar perfil existente');
    } finally {
      setCheckingProfile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não encontrado. Faça login novamente.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!companyName.trim()) {
      toast({
        title: "Nome da empresa obrigatório",
        description: "Por favor, preencha o nome da empresa.",
        variant: "destructive",
      });
      return;
    }

    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      devLog('Starting company setup process for user:', user.id);
      
      const profileData = {
        company_name: companyName.trim(),
        business_type: businessType.trim() || null,
      };

      devLog('Attempting to save profile with data:', profileData);
      const profile = await upsertProfile(user.id, profileData);
      devLog('Profile saved successfully:', profile);

      // Create default company settings (non-blocking)
      try {
        devLog('Creating default company settings...');
        await createDefaultSettings(user.id, companyName.trim());
        devLog('Default settings created successfully');
      } catch (settingsError: any) {
        devError('Error creating default settings (non-blocking):', settingsError);
        toast({
          title: "Parcialmente configurado",
          description: "Empresa criada, mas algumas configurações serão definidas depois.",
          variant: "default",
        });
      }

      toast({
        title: "Empresa configurada com sucesso!",
        description: "Redirecionando para o painel principal...",
      });

      // Redirect after success
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);

    } catch (error: unknown) {
      devError('Error in company setup:', error);
      
      const errorMessage = error?.message || "Erro inesperado ao configurar empresa";
      setError(errorMessage);
      
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando dados do usuário...</p>
        </div>
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
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Erro na configuração</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

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
                className={error ? 'border-red-300' : ''}
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
