
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
      <div className="flex items-center gap-2">
        <Link className="w-5 h-5 text-whatsapp-green" />
        <h3 className="text-lg font-semibold text-gray-800">Link Personalizado</h3>
      </div>
      
      <div>
        <Label htmlFor="custom-slug" className="text-sm font-medium text-gray-800 mb-3 block">
          Slug Personalizado
        </Label>
        
        {/* Domínio base */}
        <div className="mb-2">
          <span className="text-sm text-gray-600 font-medium">
            {baseDomain}/public/
          </span>
        </div>
        
        {/* Campo de entrada */}
        <div className="relative">
          <Input
            id="custom-slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            className="text-gray-900 font-medium bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
            placeholder="minha-empresa"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {getSlugStatusIcon()}
          </div>
        </div>
        
        {getStatusMessage() && (
          <p className={`text-sm mt-2 ${slugValidation.isValid && isSlugAvailable ? 'text-green-600' : 'text-red-600'}`}>
            {getStatusMessage()}
          </p>
        )}
      </div>

      <div className="text-sm text-gray-600">
        <p className="font-medium mb-1">Dicas:</p>
        <ul className="text-xs space-y-1 list-disc list-inside">
          <li>Use apenas letras minúsculas, números e hífens</li>
          <li>Mantenha entre 3-50 caracteres</li>
          <li>Evite hífens no início ou fim</li>
        </ul>
      </div>
    </div>
  );
};

export default SlugSettingsSection;
