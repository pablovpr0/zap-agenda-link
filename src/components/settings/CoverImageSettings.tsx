import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, X, Save } from 'lucide-react';
import { useCoverImageUpload } from '@/hooks/useCoverImageUpload';
import CompanyHeaderWithCover from '@/components/public-booking/CompanyHeaderWithCover';

interface CoverImageSettingsProps {
  companyName: string;
  businessType?: string;
  address?: string;
  logoUrl?: string;
  currentCoverUrl?: string;
  onSave?: (coverUrl: string) => void;
}

const CoverImageSettings = ({
  companyName,
  businessType,
  address,
  logoUrl,
  currentCoverUrl,
  onSave
}: CoverImageSettingsProps) => {
  const [tempCoverUrl, setTempCoverUrl] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const { uploadCoverImage, isUploading, uploadProgress } = useCoverImageUpload({
    onUploadSuccess: (url) => {
      setTempCoverUrl(url);
      setHasChanges(true);
    }
  });

  const handleCoverUpload = async (file: File) => {
    await uploadCoverImage(file);
  };

  const handleSave = () => {
    if (tempCoverUrl && onSave) {
      onSave(tempCoverUrl);
      setHasChanges(false);
    }
  };

  const handleDiscard = () => {
    setTempCoverUrl(null);
    setHasChanges(false);
  };

  const displayCoverUrl = tempCoverUrl || currentCoverUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Foto de Capa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview do cabeçalho */}
        <div className="border rounded-lg overflow-hidden">
          <CompanyHeaderWithCover
            companyName={companyName}
            businessType={businessType}
            address={address}
            logoUrl={logoUrl}
            coverUrl={displayCoverUrl}
            onCoverUpload={handleCoverUpload}
            canEditCover={true}
          />
        </div>

        {/* Progress bar durante upload */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Fazendo upload...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Botões de ação */}
        {hasChanges && (
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleDiscard}
              disabled={isUploading}
            >
              <X className="w-4 h-4 mr-2" />
              Descartar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUploading}
              className="bg-whatsapp-green hover:bg-green-600"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        )}

        {/* Informações sobre a foto de capa */}
        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
          <h4 className="font-medium mb-2">Dicas para uma boa foto de capa:</h4>
          <ul className="space-y-1 text-xs">
            <li>• Resolução recomendada: 1200x400 pixels</li>
            <li>• Formatos aceitos: JPG, PNG, WebP</li>
            <li>• Tamanho máximo: 5MB</li>
            <li>• A foto de perfil ficará sobreposta à capa</li>
            <li>• Use imagens com boa qualidade e boa iluminação</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CoverImageSettings;