import React, { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompanyHeaderWithCoverProps {
  companyName: string;
  businessType?: string;
  address?: string;
  logoUrl?: string;
  coverUrl?: string;
  onCoverUpload?: (file: File) => void;
  canEditCover?: boolean;
}

const CompanyHeaderWithCover = ({ 
  companyName, 
  businessType, 
  address, 
  logoUrl,
  coverUrl,
  onCoverUpload,
  canEditCover = false
}: CompanyHeaderWithCoverProps) => {
  const [previewCover, setPreviewCover] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const defaultLogo = `https://api.dicebear.com/7.x/initials/svg?seed=${companyName}`;
  const currentCover = previewCover || coverUrl;

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewCover(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      if (onCoverUpload) {
        onCoverUpload(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeCover = () => {
    setPreviewCover(null);
  };

  return (
    <div className="relative bg-[#FAFAFA] public-page overflow-hidden">
      {/* Foto de Capa */}
      <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 public-surface">
        {currentCover ? (
          <img
            src={currentCover}
            alt="Foto de capa"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <div className="text-center text-gray-500 public-text-secondary">
              <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Foto de capa</p>
            </div>
          </div>
        )}

        {/* Overlay para upload (apenas se canEditCover for true) */}
        {canEditCover && (
          <div
            className={`absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center transition-opacity ${
              isDragging ? 'opacity-100' : 'opacity-0 hover:opacity-100'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="text-center text-white">
              <Upload className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Clique ou arraste uma foto</p>
              <p className="text-xs opacity-80">JPG, PNG até 5MB</p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        )}

        {/* Botão remover capa */}
        {canEditCover && currentCover && (
          <Button
            onClick={removeCover}
            size="sm"
            variant="outline"
            className="absolute top-4 right-4 bg-white/80 hover:bg-white border-white/50 text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        {/* Gradiente inferior para transição suave */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#FAFAFA] to-transparent public-gradient-overlay"></div>
      </div>

      {/* Seção de Perfil - Sobreposta à capa */}
      <div className="relative -mt-16 flex flex-col items-center px-4 pb-6">
        {/* Logo circular com efeito 3D */}
        <div className="relative mb-4">
          <div className="w-[120px] h-[120px] rounded-full border-4 border-white shadow-lg overflow-hidden bg-white company-profile-shadow">
            <img
              src={logoUrl || defaultLogo}
              alt={companyName}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = defaultLogo;
              }}
            />
          </div>
          
          {/* Sombra adicional para efeito 3D */}
          <div className="absolute inset-0 rounded-full shadow-2xl pointer-events-none company-profile-3d-shadow"></div>
        </div>

        {/* Informações da empresa */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-black public-text">
            {companyName}
          </h1>
          
          {businessType && (
            <p className="text-gray-600 public-text-secondary text-base">
              {businessType}
            </p>
          )}
          
          {address && (
            <p className="text-gray-500 public-text-secondary text-sm">
              {address}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyHeaderWithCover;