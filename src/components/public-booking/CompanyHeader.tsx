
import { MapPin, Star, MessageCircle } from 'lucide-react';

interface CompanyHeaderProps {
  companySettings: {
    logo_url?: string;
    address?: string;
    welcome_message?: string;
  };
  profile: {
    company_name: string;
    business_type: string;
    profile_image_url?: string;
  };
}

const CompanyHeader = ({ companySettings, profile }: CompanyHeaderProps) => {
  return (
    <div className="bg-white public-surface public-card-border rounded-xl shadow-lg p-6 mb-6">
      <div className="text-center">
        {/* Foto de perfil grande e redonda */}
        {(companySettings?.logo_url || profile?.profile_image_url) && (
          <div className="mb-4">
            <img
              src={companySettings.logo_url || profile.profile_image_url}
              alt={profile?.company_name || 'Logo'}
              className="w-24 h-24 rounded-full mx-auto object-cover border-4 profile-border profile-shadow"
            />
          </div>
        )}
        
        {/* Nome da empresa com fonte grande */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {profile?.company_name || 'Empresa'}
        </h1>
        
        {/* Tipo de negócio */}
        <p className="text-green-600 font-medium mb-2 flex items-center justify-center gap-1">
          <Star className="w-4 h-4" />
          {profile?.business_type || 'Serviços'}
        </p>

        {/* Mensagem de boas-vindas */}
        {companySettings?.welcome_message && (
          <p className="text-gray-600 text-sm mb-4 italic">
            "{companySettings.welcome_message}"
          </p>
        )}

        {/* Endereço */}
        {companySettings?.address && (
          <div className="flex items-center justify-center gap-2 text-gray-600 text-sm mb-4">
            <MapPin className="w-4 h-4 text-green-500" />
            <span>{companySettings.address}</span>
          </div>
        )}

        {/* Chamada para ação */}
        <div className="bg-green-500 text-white py-3 px-6 rounded-full font-semibold text-lg shadow-md">
          <MessageCircle className="w-5 h-5 inline mr-2" />
          Agende seu horário
        </div>
      </div>
    </div>
  );
};

export default CompanyHeader;
