
import { CheckCircle, Star } from 'lucide-react';
import { CompanySettings, Profile } from '@/types/publicBooking';

interface EnhancedCompanyHeaderProps {
  companySettings: CompanySettings;
  profile: Profile;
}

const EnhancedCompanyHeader = ({ companySettings, profile }: EnhancedCompanyHeaderProps) => {
  return (
    <div className="text-center mb-8">
      <div className="bg-white rounded-2xl p-8 shadow-xl border border-green-100 relative overflow-hidden">
        {/* Decoração de fundo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-blue-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-100 to-pink-100 rounded-full translate-y-12 -translate-x-12 opacity-50"></div>
        
        <div className="relative z-10">
          {companySettings.logo_url && (
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img 
                  src={companySettings.logo_url} 
                  alt={profile.company_name} 
                  className="company-logo"
                />
                <div className="absolute -bottom-2 -right-2 public-bg-primary rounded-full p-2">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          )}
          
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            <span className="public-gradient bg-clip-text text-transparent">
              {profile.company_name}
            </span>
          </h1>
          
          {profile.business_type && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4" 
                 style={{
                   backgroundColor: 'var(--public-theme-background)',
                   color: 'var(--public-theme-primary)'
                 }}>
              <Star className="w-4 h-4" />
              {profile.business_type}
            </div>
          )}
          
          {companySettings.welcome_message && (
            <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl">
              {companySettings.welcome_message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedCompanyHeader;
