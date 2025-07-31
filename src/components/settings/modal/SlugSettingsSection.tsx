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
  const baseDomain = getDomainConfig();
  return;
};
export default SlugSettingsSection;