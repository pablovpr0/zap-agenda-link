
import React from 'react';
import { Crown, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const DemoModeIndicator = () => {
  return (
    <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <Crown className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-800">Modo Demonstração</h3>
            <p className="text-sm text-yellow-700">
              Você está explorando o ZapAgenda. Para desbloquear todas as funcionalidades, 
              ative seu plano Premium por R$ 39,90/mês.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DemoModeIndicator;
