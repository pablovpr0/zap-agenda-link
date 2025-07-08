
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { updateCompanySlug } from '@/services/companySettingsService';
import SlugInput from './slug/SlugInput';
import SlugPreview from './slug/SlugPreview';
import SlugTips from './slug/SlugTips';
import SlugUpdateButton from './slug/SlugUpdateButton';

interface SlugSettingsProps {
  currentSlug: string;
  onSlugUpdate: (newSlug: string) => void;
}

const SlugSettings = ({ currentSlug, onSlugUpdate }: SlugSettingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [newSlug, setNewSlug] = useState(currentSlug);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleValidationChange = (valid: boolean, available: boolean | null) => {
    setIsValid(valid);
    setIsAvailable(available);
  };

  const handleUpdateSlug = async () => {
    if (!user || !isValid || !isAvailable) return;

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

  const canUpdate = isValid && isAvailable && newSlug !== currentSlug && !isChecking;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="w-5 h-5" />
          Link Personalizado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SlugInput
          slug={newSlug}
          currentSlug={currentSlug}
          onSlugChange={setNewSlug}
          onValidationChange={handleValidationChange}
        />

        <SlugPreview slug={newSlug} />

        <SlugTips />

        <SlugUpdateButton
          canUpdate={canUpdate}
          isUpdating={isUpdating}
          onUpdate={handleUpdateSlug}
        />
      </CardContent>
    </Card>
  );
};

export default SlugSettings;
