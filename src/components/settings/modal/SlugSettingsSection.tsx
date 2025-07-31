
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Link, CheckCircle, AlertCircle } from 'lucide-react';
import { validateSlug, isSlugTaken } from '@/services/companySettingsService';
import { getDomainConfig } from '@/lib/domainConfig';

interface SlugSettingsSectionProps {
  slug: string;
  originalSlug: string;
  onSlugChange: (slug: string) => void;
}

const SlugSettingsSection = ({
  slug,
  originalSlug,
  onSlugChange
}: SlugSettingsSectionProps) => {
  const [slugValidation, setSlugValidation] = useState<{
    isValid: boolean;
    error?: string;
  }>({
    isValid: true
  });
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);

  // Validação de slug em tempo real
  useEffect(() => {
    const checkSlug = async () => {
      if (slug === originalSlug) {
        setSlugValidation({
          isValid: true
        });
        setIsSlugAvailable(true);
        return;
      }
      const validation = validateSlug(slug);
      setSlugValidation(validation);
      if (validation.isValid) {
        try {
          const taken = await isSlugTaken(slug);
          setIsSlugAvailable(!taken);
        } catch (error) {
          setIsSlugAvailable(null);
        }
      } else {
        setIsSlugAvailable(null);
      }
    };
    if (slug) {
      const timer = setTimeout(checkSlug, 500);
      return () => clearTimeout(timer);
    }
  }, [slug, originalSlug]);

  const handleSlugChange = (value: string) => {
    const cleanSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-');
    onSlugChange(cleanSlug);
  };

  const getSlugStatusIcon = () => {
    if (!slugValidation.isValid) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (isSlugAvailable === false) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (isSlugAvailable === true) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return null;
  };

  const getStatusMessage = () => {
    if (!slugValidation.isValid) return slugValidation.error;
    if (isSlugAvailable === false) return 'Este slug já está sendo usado';
    if (isSlugAvailable === true && slug !== originalSlug) return 'Slug disponível!';
    return '';
  };

  const baseDomain = getDomainConfig();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Link className="w-5 h-5" />
        Link Personalizado (Slug)
      </h3>
      
      <div className="space-y-2">
        <Label htmlFor="slug">Slug do seu negócio</Label>
        <div className="relative">
          <Input
            id="slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="meu-negocio"
            className="pr-10"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {getSlugStatusIcon()}
          </div>
        </div>
        
        {getStatusMessage() && (
          <p className={`text-sm ${
            !slugValidation.isValid || isSlugAvailable === false 
              ? 'text-red-600' 
              : 'text-green-600'
          }`}>
            {getStatusMessage()}
          </p>
        )}
      </div>

      <div className="bg-gray-50 p-3 rounded-md">
        <p className="text-sm text-gray-600 mb-2">Seu link público será:</p>
        <p className="font-mono text-sm bg-white p-2 rounded border">
          {baseDomain}/agendar/{slug || 'seu-slug'}
        </p>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Use apenas letras minúsculas, números e hífens</p>
        <p>• O slug deve ser único e identificar seu negócio</p>
        <p>• Evite alterar frequentemente para não quebrar links compartilhados</p>
      </div>
    </div>
  );
};

export default SlugSettingsSection;
