
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image } from 'lucide-react';

interface ImageUploadProps {
  bucket: string;
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  acceptedFileTypes?: string;
  maxSizeMB?: number;
  className?: string;
  placeholder?: string;
}

const ImageUpload = ({
  bucket,
  currentImageUrl,
  onImageUploaded,
  acceptedFileTypes = "image/*",
  maxSizeMB = 5,
  className = "",
  placeholder = "Clique para fazer upload"
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImageUrl || '');
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamanho do arquivo
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: `O arquivo deve ter no máximo ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return;
    }

    // Validar tipo do arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione uma imagem válida",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Fazer upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) throw error;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setPreview(publicUrl);
      onImageUploaded(publicUrl);

      toast({
        title: "Upload realizado com sucesso!",
        description: "A imagem foi carregada com sucesso.",
      });

    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer o upload da imagem.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview('');
    onImageUploaded('');
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        accept={acceptedFileTypes}
        onChange={handleFileSelect}
        className="hidden"
        id={`file-upload-${bucket}`}
        disabled={uploading}
      />
      
      <label
        htmlFor={`file-upload-${bucket}`}
        className="relative block w-full cursor-pointer"
      >
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-40 object-cover rounded-lg border-2 border-dashed border-gray-300 hover:border-whatsapp-green transition-colors"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`file-upload-${bucket}`)?.click();
                  }}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Trocar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveImage();
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Remover
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg hover:border-whatsapp-green transition-colors flex items-center justify-center">
            <div className="text-center text-gray-500">
              {uploading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green mb-2"></div>
                  <p>Fazendo upload...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Image className="w-8 h-8 mb-2" />
                  <p>{placeholder}</p>
                  <p className="text-xs mt-1">Máximo {maxSizeMB}MB</p>
                </div>
              )}
            </div>
          </div>
        )}
      </label>
    </div>
  );
};

export default ImageUpload;
