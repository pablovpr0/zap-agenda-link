import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

interface UseCoverImageUploadProps {
  onUploadSuccess?: (url: string) => void;
  maxSizeInMB?: number;
  allowedTypes?: string[];
}

export const useCoverImageUpload = ({
  onUploadSuccess,
  maxSizeInMB = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
}: UseCoverImageUploadProps = {}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    // Verificar tipo de arquivo
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato não suportado",
        description: "Por favor, selecione uma imagem JPG, PNG ou WebP.",
        variant: "destructive",
      });
      return false;
    }

    // Verificar tamanho do arquivo
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      toast({
        title: "Arquivo muito grande",
        description: `A imagem deve ter no máximo ${maxSizeInMB}MB.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const uploadCoverImage = async (file: File): Promise<string | null> => {
    if (!validateFile(file)) {
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Importar supabase dinamicamente para evitar problemas de SSR
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `cover-${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      // Simular progresso inicial
      setUploadProgress(20);

      // Upload para o Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-covers')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(80);

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('company-covers')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Não foi possível obter URL da imagem');
      }

      setUploadProgress(100);

      toast({
        title: "Upload concluído",
        description: "Foto de capa atualizada com sucesso!",
      });

      if (onUploadSuccess) {
        onUploadSuccess(urlData.publicUrl);
      }

      return urlData.publicUrl;
    } catch (error: unknown) {
      devError('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível fazer o upload da imagem. Tente novamente.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    uploadCoverImage,
    isUploading,
    uploadProgress,
    validateFile
  };
};