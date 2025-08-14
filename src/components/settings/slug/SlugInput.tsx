
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { validateSlug, isSlugTaken } from '@/services/companySettingsService';
import { getDomainConfig } from '@/lib/domainConfig';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

interface SlugInputProps {
  slug: string;
  currentSlug: string;
  onSlugChange: (slug: string) => void;
  onValidationChange: (isValid: boolean, isAvailable: boolean | null) => void;
}

const SlugInput = ({ slug, currentSlug, onSlugChange, onValidationChange }: SlugInputProps) => {
  const [isChecking, setIsChecking] = useState(false);
  const [validation, setValidation] = useState<{ isValid: boolean; error?: string }>({ isValid: true });
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const baseDomain = getDomainConfig();

  // Validação em tempo real
  useEffect(() => {
    const checkSlug = async () => {
      if (slug === currentSlug) {
        setValidation({ isValid: true });
        setIsAvailable(true);
        onValidationChange(true, true);
        return;
      }

      const validationResult = validateSlug(slug);
      setValidation(validationResult);

      if (validationResult.isValid) {
        setIsChecking(true);
        try {
          const taken = await isSlugTaken(slug);
          const available = !taken;
          setIsAvailable(available);
          onValidationChange(validationResult.isValid, available);
        } catch (error) {
          devError('Erro ao verificar disponibilidade:', error);
          setIsAvailable(null);
          onValidationChange(validationResult.isValid, null);
        } finally {
          setIsChecking(false);
        }
      } else {
        setIsAvailable(null);
        onValidationChange(validationResult.isValid, null);
      }
    };

    const timer = setTimeout(checkSlug, 500);
    return () => clearTimeout(timer);
  }, [slug, currentSlug, onValidationChange]);

  const handleSlugChange = (value: string) => {
    const cleanSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-');
    onSlugChange(cleanSlug);
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
    if (isAvailable === true && slug !== currentSlug) return 'Slug disponível!';
    return '';
  };

  return (
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
          value={slug}
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
  );
};

export default SlugInput;
