
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

interface SlugSettingsSectionProps {
  slug: string;
  originalSlug: string;
  onSlugChange: (slug: string) => void;
}

const SlugSettingsSection = ({ 
  slug, 
  originalSlug, 
  onSlugChange 
}: SlugSettingsSectionProps): JSX.Element => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="company-slug" className="text-sm font-medium">
          Link personalizado
        </Label>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">zapagenda.com/</span>
          <Input
            id="company-slug"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="meu-negocio"
            className="flex-1"
          />
        </div>
        <p className="text-xs text-gray-500">
          Este será o link público para seus clientes agendarem
        </p>
      </div>
      
      {slug !== originalSlug && (
        <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
          <AlertCircle className="w-4 h-4" />
          <span>Alterações pendentes - clique em "Salvar Configurações" para aplicar</span>
        </div>
      )}
    </div>
  );
};

export default SlugSettingsSection;
