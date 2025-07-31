import React, { useState } from 'react';
import { MoreVertical, Calendar, History, LogOut } from 'lucide-react';

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

      <style jsx>{`
        .client-header {
          background: var(--bg-card);
          padding: var(--space-lg) var(--space-md);
          border-bottom: 1px solid var(--border-light);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .company-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }

        .company-logo {
          width: 80px;
          height: 80px;
          border-radius: var(--radius-full);
          border: 3px solid var(--bg-card);
          box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08);
          margin-bottom: var(--space-sm);
          object-fit: cover;
        }

        .company-name {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary);
          text-align: center;
          margin: 0 0 var(--space-xs) 0;
          line-height: var(--line-height-tight);
        }

        .company-segment {
          font-size: 14px;
          color: var(--text-secondary);
          text-align: center;
          margin: 0;
          line-height: var(--line-height-normal);
        }

        .menu-container {
          position: absolute;
          top: var(--space-md);
          right: var(--space-md);
        }

        .menu-button {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: var(--space-sm);
          border-radius: var(--radius-sm);
          transition: background-color var(--transition-fast);
        }

        .menu-button:hover {
          background-color: var(--border-light);
        }

        .menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10;
        }

        .menu-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          box-shadow: 0 8px 24px var(--shadow-medium);
          min-width: 200px;
          z-index: 20;
          overflow: hidden;
          animation: menuSlideIn var(--transition-fast) ease-out;
        }

        @keyframes menuSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .menu-item {
          width: 100%;
          padding: var(--space-md);
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-size: 14px;
          color: var(--text-primary);
          transition: background-color var(--transition-fast);
        }

        .menu-item:hover {
          background-color: var(--border-light);
        }

        .menu-item-danger {
          color: #dc2626;
        }

        .menu-item-danger:hover {
          background-color: #fef2f2;
        }

        .menu-divider {
          height: 1px;
          background-color: var(--border-light);
          margin: var(--space-xs) 0;
        }

        @media (min-width: 768px) {
          .company-logo {
            width: 100px;
            height: 100px;
          }

          .company-name {
            font-size: 24px;
          }

          .company-segment {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default ClientHeader;