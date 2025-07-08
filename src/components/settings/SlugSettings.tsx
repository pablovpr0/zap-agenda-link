
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="w-5 h-5" />
          Link Personalizado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="custom-slug" className="text-sm font-medium text-gray-800 mb-3 block">
            Slug Personalizado
          </Label>
          
          {/* Domínio base em linha separada */}
          <div className="mb-2">
            <span className="text-sm text-gray-600 font-medium">
              {baseDomain}/public/
            </span>
          </div>
          
          {/* Campo de entrada em linha separada */}
          <div className="relative">
            <Input
              id="custom-slug"
              value={newSlug}
              onChange={(e) => handleSlugChange(e.target.value)}
              className="text-gray-900 font-medium bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
              placeholder="minha-empresa"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getStatusIcon()}
            </div>
          </div>
          
          {getStatusMessage() && (
            <p className={`text-sm mt-2 ${validation.isValid && isAvailable ? 'text-green-600' : 'text-red-600'}`}>
              {getStatusMessage()}
            </p>
          )}
        </div>

        <div className="bg-gray-50 p-3 rounded-md border">
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Preview da URL:
          </Label>
          <div className="flex items-center gap-2">
            <code className="bg-white px-2 py-1 rounded border text-sm flex-1 text-gray-800 break-all">
              {previewUrl}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(previewUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p className="font-medium mb-1">Dicas:</p>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li>Use apenas letras minúsculas, números e hífens</li>
            <li>Mantenha entre 3-50 caracteres</li>
            <li>Evite hífens no início ou fim</li>
          </ul>
        </div>

        <Button 
          onClick={handleUpdateSlug}
          disabled={!canUpdate || isUpdating}
          className="w-full"
        >
          {isUpdating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              <Link className="w-4 h-4 mr-2" />
              Atualizar Link Personalizado
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SlugSettings;
