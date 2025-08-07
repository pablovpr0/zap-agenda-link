import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Moon, Sun } from 'lucide-react';

interface ModernHeroSectionProps {
  companyData: any;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onScrollToBooking: () => void;
}

const ModernHeroSection: React.FC<ModernHeroSectionProps> = ({
  companyData,
  darkMode,
  onToggleDarkMode,
  onScrollToBooking
}) => {
  const coverImage = companyData?.cover_image_url || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&h=400&fit=crop';
  const profileImage = companyData?.logo_url || companyData?.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${companyData?.company_name}`;

  return (
    <div className="relative">
      {/* Dark Mode Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleDarkMode}
        className="absolute top-4 right-4 z-20 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
      >
        {darkMode ? <Sun className="h-5 w-5 text-white" /> : <Moon className="h-5 w-5 text-white" />}
      </Button>

      {/* Cover Image */}
      <div className="relative h-64 md:h-80 overflow-hidden cover-image-container">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat cover-image-container"
          style={{ backgroundImage: `url(${coverImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60" />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse" />
          <div className="absolute top-1/2 -left-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-8 right-1/4 w-16 h-16 bg-green-500/10 rounded-full blur-lg animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      {/* Profile Section - Overlapping */}
      <div className="relative -mt-20 pb-8">
        <div className="flex flex-col items-center px-4">
          {/* Profile Image with 3D Effect */}
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full blur-lg opacity-30 scale-110 animate-pulse" />
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 profile-border profile-shadow transform hover:scale-105 transition-all duration-300">
              <img
                src={profileImage}
                alt={companyData?.company_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${companyData?.company_name}`;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            </div>
          </div>

          {/* Company Name */}
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
            {companyData?.company_name}
          </h1>

          {/* Business Type Badge */}
          <Badge variant="secondary" className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {companyData?.business_type}
          </Badge>

          {/* Primary CTA */}
          <Button
            onClick={onScrollToBooking}
            size="lg"
            className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            Agende seu horário
          </Button>

          {/* Slogan with Glow Effect */}
          <div className="relative max-w-md text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-xl rounded-lg" />
            <p className="relative text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed px-4 py-2">
              Escolha seu horário para você e confirme seu agendamento de forma{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">rápida</span> e{' '}
              <span className="font-semibold text-green-600 dark:text-green-400">segura</span>
            </p>
          </div>

          {/* Instant Confirmation Badge */}
          <div className="flex items-center mt-4 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Confirmação instantânea
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernHeroSection;