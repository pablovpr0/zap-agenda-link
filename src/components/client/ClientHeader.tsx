
import React, { useState } from 'react';
import { MoreVertical, Calendar, History, LogOut } from 'lucide-react';
import './ClientHeader.css';

export type MenuAction = 'appointments' | 'history' | 'logout';

interface ClientHeaderProps {
  companyName: string;
  companySegment: string;
  companyLogo: string;
  onMenuAction: (action: MenuAction) => void;
}

const ClientHeader: React.FC<ClientHeaderProps> = ({
  companyName,
  companySegment,
  companyLogo,
  onMenuAction
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuClick = (action: MenuAction) => {
    setIsMenuOpen(false);
    onMenuAction(action);
  };

  return (
    <div className="client-header">
      <div className="company-info">
        <img
          src={companyLogo}
          alt={companyName}
          className="company-logo"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${companyName}`;
          }}
        />
        <h1 className="company-name">{companyName}</h1>
        <p className="company-segment">{companySegment}</p>
      </div>

      <div className="menu-container">
        <button
          className="menu-button touch-target"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Menu de opções"
        >
          <MoreVertical size={20} />
        </button>

        {isMenuOpen && (
          <>
            <div 
              className="menu-overlay" 
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="menu-dropdown">
              <button
                className="menu-item"
                onClick={() => handleMenuClick('appointments')}
              >
                <Calendar size={16} />
                <span>Meus Agendamentos</span>
              </button>
              <button
                className="menu-item"
                onClick={() => handleMenuClick('history')}
              >
                <History size={16} />
                <span>Histórico</span>
              </button>
              <div className="menu-divider" />
              <button
                className="menu-item menu-item-danger"
                onClick={() => handleMenuClick('logout')}
              >
                <LogOut size={16} />
                <span>Sair</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClientHeader;
