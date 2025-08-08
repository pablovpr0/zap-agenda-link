import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CollapsingHeaderProps {
  companyName: string;
  businessType?: string;
  address?: string;
  logoUrl?: string;
  coverUrl?: string;
  onCoverUpload?: (file: File) => void;
  canEditCover?: boolean;
}

const CollapsingHeader = ({ 
  companyName, 
  businessType, 
  address, 
  logoUrl,
  coverUrl,
  onCoverUpload,
  canEditCover = false
}: CollapsingHeaderProps) => {
  const [previewCover, setPreviewCover] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const defaultLogo = `https://api.dicebear.com/7.x/initials/svg?seed=${companyName}`;
  const currentCover = previewCover || coverUrl;

  // Configurações da animação - mais responsiva
  const COLLAPSE_THRESHOLD = 50; // Começa mais cedo
  const FULL_COLLAPSE_THRESHOLD = 120; // Termina mais cedo

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calcular progresso da animação
  const progress = scrollY > COLLAPSE_THRESHOLD 
    ? Math.min((scrollY - COLLAPSE_THRESHOLD) / (FULL_COLLAPSE_THRESHOLD - COLLAPSE_THRESHOLD), 1)
    : 0;

  const showStickyHeader = scrollY > COLLAPSE_THRESHOLD;

  // Transição em linha reta para o canto superior esquerdo
  const logoSize = 120 - (80 * progress); // De 120px para 40px (diminui durante o trajeto)
  
  // Movimento em linha reta para o canto superior esquerdo
  // Destino: canto superior esquerdo onde ficará a foto do sticky header
  // Posição final: 36px da esquerda, 32px do topo
  // Posição inicial: centro da tela (~200px horizontal, ~128px vertical)
  
  const logoTranslateX = -164 * progress; // Linha reta horizontal
  const logoTranslateY = -96 * progress;  // Linha reta vertical
  
  // A foto desaparece mais rapidamente criando efeito dramático
  const logoOpacity = Math.max(0, 1 - progress * 2); // Desaparece mais rapidamente
  
  const nameOpacity = Math.max(0, 1 - progress * 3); // Desaparece mais rapidamente
  const businessTypeOpacity = Math.max(0, 1 - progress * 2.5); // Desaparece rapidamente
  const addressOpacity = Math.max(0, 1 - progress * 2.5); // Desaparece rapidamente
  
  // Sticky header aparece muito mais rapidamente
  const stickyHeaderOpacity = Math.min(1, progress * 4); // Aparece 4x mais rápido
  const stickyHeaderTranslateY = -8 + (8 * Math.min(1, progress * 4)); // Movimento mais sutil e rápido

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
    <>
      {/* Sticky Header - Aparece quando colapsado */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAFA]/95 backdrop-blur-sm border-b border-gray-200 public-page public-surface transition-all duration-300 ease-out"
        style={{
          opacity: stickyHeaderOpacity,
          transform: `translateY(${stickyHeaderTranslateY}px)`,
          pointerEvents: showStickyHeader ? 'auto' : 'none'
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3 max-w-md mx-auto">
          {/* Foto do sticky header - aparece muito mais rapidamente */}
          <div 
            className="w-10 h-10 rounded-full overflow-hidden bg-white border-2 profile-border flex-shrink-0 transition-opacity duration-150 ease-out"
            style={{
              opacity: Math.min(1, progress * 3) // Aparece 3x mais rapidamente
            }}
          >
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
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-black public-text truncate">
              {companyName}
            </h2>
          </div>
        </div>
      </div>

      {/* Header Principal */}
      <div className="relative bg-[#FAFAFA] public-page overflow-hidden">
        {/* Foto de Capa */}
        <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 cover-image-container">
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
          {/* Logo circular que se move para trás do cabeçalho */}
          <div 
            className="relative mb-4 transition-all duration-300 ease-out z-30"
            style={{
              transform: `translate(${logoTranslateX}px, ${logoTranslateY}px)`,
            }}
          >
            <div 
              className="rounded-full border-4 profile-border profile-shadow overflow-hidden bg-white transition-all duration-300 ease-out"
              style={{
                width: `${logoSize}px`,
                height: `${logoSize}px`,
                borderWidth: `${4 - (2 * progress)}px`,
                opacity: logoOpacity, // Desaparece quando passa por baixo
              }}
            >
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
            
            {/* Sombra adicional para efeito 3D - diminui conforme o progresso */}
            <div 
              className="absolute inset-0 rounded-full shadow-2xl pointer-events-none company-profile-3d-shadow transition-opacity duration-300 ease-out"
              style={{
                opacity: 1 - progress * 0.7 // Diminui a sombra conforme colapsa
              }}
            ></div>
          </div>

          {/* Informações da empresa */}
          <div 
            className="text-center space-y-1 transition-all duration-300 ease-out"
            style={{
              opacity: nameOpacity,
            }}
          >
            <h1 className="text-xl font-bold text-black public-text">
              {companyName}
            </h1>
            
            {businessType && (
              <p 
                className="text-gray-600 public-text-secondary text-base transition-opacity duration-300 ease-out"
                style={{ opacity: businessTypeOpacity }}
              >
                {businessType}
              </p>
            )}
            
            {address && (
              <div 
                className="flex items-center justify-center gap-2 text-gray-500 public-text-secondary text-sm transition-opacity duration-300 ease-out"
                style={{ opacity: addressOpacity }}
              >
                <MapPin className="w-4 h-4 text-[var(--public-theme-primary)] dynamic-primary" />
                <span>{address}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CollapsingHeader;