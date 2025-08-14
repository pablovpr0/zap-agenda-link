
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw, Clock } from 'lucide-react';

interface RealTimeSyncIndicatorProps {
  isConnected: boolean;
  isSyncing: boolean;
  lastSync?: Date;
  nextRefresh?: number; // segundos até próximo refresh
  className?: string;
}

const RealTimeSyncIndicator = ({ 
  isConnected, 
  isSyncing, 
  lastSync,
  nextRefresh,
  className = "" 
}: RealTimeSyncIndicatorProps) => {
  
  const formatLastSync = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 10) return 'agora';
    if (diffSeconds < 60) return `${diffSeconds}s atrás`;
    
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}min atrás`;
    
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isSyncing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          Sincronizando...
        </Badge>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <WifiOff className="w-3 h-3 mr-1" />
          Desconectado
        </Badge>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-xs text-gray-500 ${className}`}>
      <div className="flex items-center gap-1">
        <Wifi className="w-3 h-3 text-green-500" />
        <span>Conectado</span>
      </div>
      
      {lastSync && (
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>atualizado {formatLastSync(lastSync)}</span>
        </div>
      )}

      {nextRefresh && nextRefresh > 0 && (
        <Badge variant="outline" className="text-xs">
          {nextRefresh}s
        </Badge>
      )}
    </div>
  );
};

export default RealTimeSyncIndicator;
