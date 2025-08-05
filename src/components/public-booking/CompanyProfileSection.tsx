
import React from 'react';

interface CompanyProfileSectionProps {
  companyName: string;
  businessType?: string;
  address?: string;
  logoUrl?: string;
}

const CompanyProfileSection = ({ 
  companyName, 
  businessType, 
  address, 
  logoUrl 
}: CompanyProfileSectionProps) => {
  const defaultLogo = `https://api.dicebear.com/7.x/initials/svg?seed=${companyName}`;

  return (
    <div className="flex flex-col items-center px-4 py-6 bg-[#FAFAFA] public-page">
      {/* Logo circular grande */}
      <div className="relative mb-4">
        <div className="w-[120px] h-[120px] rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
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
  );
};

export default CompanyProfileSection;
