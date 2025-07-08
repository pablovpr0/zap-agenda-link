
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

const SlugSettingsSection = ({ slug, originalSlug, onSlugChange }: SlugSettingsSectionProps) => {
  const [slugValidation, setSlugValidation] = useState<{ isValid: boolean; error?: string }>({ isValid: true });
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);

  // Validação de slug em tempo real
  useEffect(() => {
    const checkSlug = async () => {
      if (slug === originalSlug) {
        setSlugValidation({ isValid: true });
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
    const cleanSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-');
    onSlugChange(cleanSlug);
  };

  const getSlugStatusIcon = () => {
    if (!slugValidation.isValid) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (isSlugAvailable === false) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (isSlugAvailable === true) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return null;
  };

  const baseDomain = getDomainConfig();

  return (
    <div className="space-y-2">
      <Label htmlFor="slug" className="flex items-center gap-2 text-sm font-medium text-gray-800">
        <Link className="w-4 h-4" />
        Link Personalizado
      </Label>
      <div className="flex rounded-md shadow-sm">
        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-600 text-sm font-medium">
          {baseDomain}/public/
        </span>
        <div className="relative flex-1">
          <Input
            id="slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            className="rounded-l-none text-gray-900 font-medium bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            placeholder="minha-empresa"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {getSlugStatusIcon()}
          </div>
        </div>
      </div>
      {!slugValidation.isValid && (
        <p className="text-sm text-red-600">
          {slugValidation.error}
        </p>
      )}
      {isSlugAvailable === false && (
        <p className="text-sm text-red-600">
          Este slug já está sendo usado
        </p>
      )}
      <p className="text-sm text-gray-600">
        URL personalizada para sua página de agendamentos
      </p>
    </div>
  );
};

export default SlugSettingsSection;
