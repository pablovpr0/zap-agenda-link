import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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
      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Aqui você implementaria o upload real para seu storage
      // Por enquanto, vamos simular com um delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular URL de retorno
      const mockUrl = URL.createObjectURL(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      toast({
        title: "Upload concluído",
        description: "Foto de capa atualizada com sucesso!",
      });

      if (onUploadSuccess) {
        onUploadSuccess(mockUrl);
      }

      return mockUrl;
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer o upload da imagem. Tente novamente.",
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