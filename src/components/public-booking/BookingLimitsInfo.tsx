import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info, Crown } from 'lucide-react';

interface BookingLimitsInfoProps {
  simultaneousLimit?: {
    canBook: boolean;
    currentCount: number;
    limit: number;
    message?: string;
  };
  monthlyLimit?: {
    canBook: boolean;
    currentCount: number;
    limit: number;
    message?: string;
  };
  isAdmin?: boolean;
  className?: string;
}

const BookingLimitsInfo = ({ 
  simultaneousLimit, 
  monthlyLimit, 
  isAdmin, 
  className = "" 
}: BookingLimitsInfoProps) => {
  
  if (isAdmin) {
    return (
      <Alert className={`border-blue-200 bg-blue-50 ${className}`}>
        <Crown className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Conta administrativa - sem limitações de agendamento.
        </AlertDescription>
      </Alert>
    );
  }

  const hasLimits = simultaneousLimit || monthlyLimit;
  if (!hasLimits) return null;

  const hasRestrictions = 
    (simultaneousLimit && !simultaneousLimit.canBook) || 
    (monthlyLimit && !monthlyLimit.canBook);

  if (hasRestrictions) {
    return (
      <Alert className={`border-red-200 bg-red-50 ${className}`} variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            {simultaneousLimit && !simultaneousLimit.canBook && (
              <p>{simultaneousLimit.message}</p>
            )}
            {monthlyLimit && !monthlyLimit.canBook && (
              <p>{monthlyLimit.message}</p>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Mostrar informações dos limites quando próximo do limite
  const showInfo = 
    (simultaneousLimit && simultaneousLimit.currentCount > 0) ||
    (monthlyLimit && monthlyLimit.currentCount > 0);

  if (showInfo) {
    return (
      <Alert className={`border-yellow-200 bg-yellow-50 ${className}`}>
        <Info className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <div className="space-y-1 text-sm">
            {simultaneousLimit && simultaneousLimit.currentCount > 0 && (
              <p>
                Agendamentos ativos: {simultaneousLimit.currentCount}/{simultaneousLimit.limit}
              </p>
            )}
            {monthlyLimit && monthlyLimit.currentCount > 0 && monthlyLimit.limit > 0 && (
              <p>
                Agendamentos este mês: {monthlyLimit.currentCount}/{monthlyLimit.limit}
              </p>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default BookingLimitsInfo;