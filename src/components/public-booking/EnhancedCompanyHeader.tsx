
import { Building2, MapPin, Phone, Instagram, MessageCircle } from 'lucide-react';
import { CompanyData } from '@/hooks/useCompanyData';

interface EnhancedCompanyHeaderProps {
  companyData: CompanyData;
}

const EnhancedCompanyHeader = ({ companyData }: EnhancedCompanyHeaderProps) => {
  const handleWhatsAppClick = () => {
    if (companyData.whatsapp) {
      const cleanPhone = companyData.whatsapp.replace(/\D/g, '');
      const message = encodeURIComponent('Olá! Gostaria de agendar um horário.');
      const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${message}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleInstagramClick = () => {
    if (companyData.instagram_url) {
      window.open(companyData.instagram_url, '_blank');
    }
  };

  const themeColor = companyData.theme_color || '#22c55e';
  
  // Usar profile_image_url primeiro, depois logo_url como fallback
  const profileImage = companyData.profile_image_url || companyData.logo_url;

  return (
    <div className="relative">
      {/* Cover Image */}
      {companyData.cover_image_url && (
        <div 
          className="h-32 md:h-48 bg-cover bg-center relative"
          style={{ 
            backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${companyData.cover_image_url})` 
          }}
        />
      )}
      
      {/* Main Header Content */}
      <div className={`${companyData.cover_image_url ? 'bg-white -mt-16 mx-4 rounded-t-2xl relative z-10' : 'bg-gradient-to-br from-green-50 to-green-100'} p-6`}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            {profileImage ? (
              <img
                src={profileImage}
                alt={companyData.company_name}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div 
                className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                style={{ backgroundColor: themeColor }}
              >
                {companyData.company_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Company Info */}
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              {companyData.company_name}
            </h1>
            
            {companyData.business_type && (
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Building2 className="w-4 h-4" />
                <span className="text-sm md:text-base">{companyData.business_type}</span>
              </div>
            )}

            {companyData.description && (
              <p className="text-gray-600 text-sm md:text-base mb-3 leading-relaxed">
                {companyData.description}
              </p>
            )}

            {/* Contact Info */}
            <div className="flex flex-wrap gap-4 text-sm">
              {companyData.address && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{companyData.address}</span>
                </div>
              )}
              
              {companyData.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{companyData.phone}</span>
                </div>
              )}
            </div>

            {/* Social Media */}
            <div className="flex gap-3 mt-3">
              {companyData.whatsapp && (
                <button
                  onClick={handleWhatsAppClick}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>
              )}
              
              {companyData.instagram_url && (
                <button
                  onClick={handleInstagramClick}
                  className="flex items-center gap-2 px-3 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        {companyData.welcome_message && (
          <div 
            className="mt-6 p-4 rounded-lg border-l-4 text-sm md:text-base"
            style={{ 
              backgroundColor: `${themeColor}10`, 
              borderLeftColor: themeColor 
            }}
          >
            <p className="text-gray-700">{companyData.welcome_message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedCompanyHeader;
