
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
    <div className="space-y-4 bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
      <Label htmlFor="slug" className="flex items-center gap-3 text-base font-bold text-green-800">
        <div className="bg-green-500 p-2 rounded-full">
          <Link className="w-5 h-5 text-white" />
        </div>
        🔗 Link Personalizado
      </Label>
      <div className="flex shadow-md rounded-lg overflow-hidden">
        <span className="inline-flex items-center px-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-sm font-semibold border-r-2 border-green-300">
          {baseDomain}/public/
        </span>
        <div className="relative flex-1">
          <Input
            id="slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            className="rounded-none border-0 focus:ring-2 focus:ring-green-500 font-medium"
            placeholder="minha-empresa"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {getSlugStatusIcon()}
          </div>
        </div>
      </div>
      {!slugValidation.isValid && (
        <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded border border-red-200">
          ❌ {slugValidation.error}
        </p>
      )}
      {isSlugAvailable === false && (
        <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded border border-red-200">
          ❌ Este slug já está sendo usado
        </p>
      )}
      <p className="text-sm text-green-700 bg-green-100 p-2 rounded border border-green-300 font-medium">
        📱 URL personalizada para sua página de agendamentos
      </p>
    </div>
  );
};

export default SlugSettingsSection;
