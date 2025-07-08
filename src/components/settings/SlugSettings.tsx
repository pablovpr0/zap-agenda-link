
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Link, CheckCircle, AlertCircle, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { validateSlug, updateCompanySlug, isSlugTaken } from '@/services/companySettingsService';
import { getDomainConfig, generatePublicBookingUrl } from '@/lib/domainConfig';

interface SlugSettingsProps {
  currentSlug: string;
  onSlugUpdate: (newSlug: string) => void;
}

const SlugSettings = ({ currentSlug, onSlugUpdate }: SlugSettingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [newSlug, setNewSlug] = useState(currentSlug);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [validation, setValidation] = useState<{ isValid: boolean; error?: string }>({ isValid: true });
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const baseDomain = getDomainConfig();
  const previewUrl = generatePublicBookingUrl(newSlug);

  // Validação em tempo real
  useEffect(() => {
    const checkSlug = async () => {
      if (newSlug === currentSlug) {
        setValidation({ isValid: true });
        setIsAvailable(true);
        return;
      }

      const validationResult = validateSlug(newSlug);
      setValidation(validationResult);

      if (validationResult.isValid) {
        setIsChecking(true);
        try {
          const taken = await isSlugTaken(newSlug);
          setIsAvailable(!taken);
        } catch (error) {
          console.error('Erro ao verificar disponibilidade:', error);
          setIsAvailable(null);
        } finally {
          setIsChecking(false);
        }
      } else {
        setIsAvailable(null);
      }
    };

    const timer = setTimeout(checkSlug, 500);
    return () => clearTimeout(timer);
  }, [newSlug, currentSlug]);

  const handleSlugChange = (value: string) => {
    const cleanSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-');
    setNewSlug(cleanSlug);
  };

  const handleUpdateSlug = async () => {
    if (!user || !validation.isValid || !isAvailable) return;

    setIsUpdating(true);
    try {
      await updateCompanySlug(user.id, newSlug);
      onSlugUpdate(newSlug);
      toast({
        title: "Slug atualizado!",
        description: "Seu link personalizado foi atualizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o slug.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(previewUrl);
      toast({
        title: "Link copiado!",
        description: "A URL foi copiada para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar a URL.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = () => {
    if (isChecking) return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;
    if (!validation.isValid) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (isAvailable === false) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (isAvailable === true) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return null;
  };

  const getStatusMessage = () => {
    if (!validation.isValid) return validation.error;
    if (isAvailable === false) return 'Este slug já está sendo usado';
    if (isAvailable === true && newSlug !== currentSlug) return 'Slug disponível!';
    return '';
  };

  const canUpdate = validation.isValid && isAvailable && newSlug !== currentSlug && !isChecking;

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-lg md:text-xl font-bold">
          <div className="bg-white/20 p-2 rounded-full">
            <Link className="w-6 md:w-7 h-6 md:h-7" />
          </div>
          🔗 Link Personalizado
        </CardTitle>
        <p className="text-green-100 text-sm mt-1">Configure sua URL personalizada de agendamentos</p>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div>
          <Label htmlFor="custom-slug" className="text-base font-semibold text-gray-800 mb-2 block">
            Slug Personalizado
          </Label>
          <div className="flex shadow-md rounded-lg overflow-hidden">
            <span className="inline-flex items-center px-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-sm font-medium border-r">
              {baseDomain}/public/
            </span>
            <div className="relative flex-1">
              <Input
                id="custom-slug"
                value={newSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="rounded-none border-0 focus:ring-2 focus:ring-green-500 text-base font-medium"
                placeholder="minha-empresa"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {getStatusIcon()}
              </div>
            </div>
          </div>
          {getStatusMessage() && (
            <p className={`text-sm mt-2 font-medium ${validation.isValid && isAvailable ? 'text-green-600' : 'text-red-600'}`}>
              {getStatusMessage()}
            </p>
          )}
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200 shadow-inner">
          <Label className="text-base font-bold text-blue-800 mb-3 flex items-center gap-2 block">
            📱 Preview da URL de Agendamento:
          </Label>
          <div className="flex items-center gap-3">
            <code className="bg-white px-4 py-3 rounded-lg border-2 border-blue-300 text-green-600 flex-1 text-sm font-mono font-bold shadow-sm">
              {previewUrl}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
              className="border-2 border-blue-300 text-blue-700 hover:bg-blue-100 shadow-md"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(previewUrl, '_blank')}
              className="border-2 border-blue-300 text-blue-700 hover:bg-blue-100 shadow-md"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-xl border-2 border-amber-200">
          <p className="font-bold mb-2 text-amber-800 flex items-center gap-2">
            💡 Dicas para um slug profissional:
          </p>
          <ul className="text-sm space-y-1 list-disc list-inside text-amber-700">
            <li>Use apenas letras minúsculas, números e hífens</li>
            <li>Mantenha entre 3-50 caracteres</li>
            <li>Evite hífens no início ou fim</li>
            <li>Seja descritivo e fácil de lembrar</li>
          </ul>
        </div>

        <Button 
          onClick={handleUpdateSlug}
          disabled={!canUpdate || isUpdating}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          {isUpdating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Atualizando Link...
            </>
          ) : (
            <>
              <Link className="w-5 h-5 mr-2" />
              Atualizar Link Personalizado
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SlugSettings;
