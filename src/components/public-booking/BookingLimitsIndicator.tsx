
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info, Crown, Clock, Calendar } from 'lucide-react';

interface BookingLimitsIndicatorProps {
  limits: {
    canBook: boolean;
    simultaneousLimit: {
      canBook: boolean;
      currentCount: number;
      limit: number;
      message?: string;
    };
    monthlyLimit: {
      canBook: boolean;
      currentCount: number;
      limit: number;
      message?: string;
    };
    isAdmin: boolean;
  } | null;
  isLoading?: boolean;
  className?: string;
}

const BookingLimitsIndicator = ({ 
  limits, 
  isLoading = false, 
  className = "" 
}: BookingLimitsIndicatorProps) => {
  
  if (isLoading) {
    return (
      <div className={`animate-pulse bg-gray-100 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">Verificando limites...</span>
        </div>
      </div>
    );
  }

  if (!limits) return null;

  if (limits.isAdmin) {
    return (
      <Alert className={`border-blue-200 bg-blue-50 ${className}`}>
        <Crown className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="flex items-center justify-between">
            <span>Conta administrativa - sem limitações</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              ADMIN
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  const hasRestrictions = !limits.canBook;

  if (hasRestrictions) {
    return (
      <Alert className={`border-red-200 bg-red-50 ${className}`} variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="font-medium">Limite de agendamentos atingido</div>
            <div className="space-y-1 text-sm">
              {!limits.simultaneousLimit.canBook && (
                <div className="flex items-center justify-between">
                  <span>{limits.simultaneousLimit.message}</span>
                  <Badge variant="destructive" className="text-xs">
                    {limits.simultaneousLimit.currentCount}/{limits.simultaneousLimit.limit}
                  </Badge>
                </div>
              )}
              {!limits.monthlyLimit.canBook && limits.monthlyLimit.limit > 0 && (
                <div className="flex items-center justify-between">
                  <span>{limits.monthlyLimit.message}</span>
                  <Badge variant="destructive" className="text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    {limits.monthlyLimit.currentCount}/{limits.monthlyLimit.limit}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Mostrar informações quando próximo do limite
  const showWarning = 
    (limits.simultaneousLimit.currentCount > 0) ||
    (limits.monthlyLimit.currentCount > 0 && limits.monthlyLimit.limit > 0);

  if (showWarning) {
    return (
      <Alert className={`border-yellow-200 bg-yellow-50 ${className}`}>
        <Info className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <div className="space-y-2">
            <div className="font-medium text-sm">Status dos seus agendamentos</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {limits.simultaneousLimit.currentCount > 0 && (
                <div className="flex items-center justify-between bg-yellow-100 rounded px-2 py-1">
                  <span>Agendamentos ativos:</span>
                  <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                    {limits.simultaneousLimit.currentCount}/{limits.simultaneousLimit.limit}
                  </Badge>
                </div>
              )}
              {limits.monthlyLimit.currentCount > 0 && limits.monthlyLimit.limit > 0 && (
                <div className="flex items-center justify-between bg-yellow-100 rounded px-2 py-1">
                  <span>Este mês:</span>
                  <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                    <Calendar className="w-3 h-3 mr-1" />
                    {limits.monthlyLimit.currentCount}/{limits.monthlyLimit.limit}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default BookingLimitsIndicator;
