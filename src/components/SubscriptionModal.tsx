
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, CreditCard } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscriptionModal = ({ isOpen, onClose }: SubscriptionModalProps) => {
  const { createCheckout, isAdmin } = useSubscription();

  // Se é admin, não mostrar o modal
  if (isAdmin) {
    return null;
  }

  const handleActivatePlan = async () => {
    await createCheckout();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 justify-center mb-4">
            <Crown className="w-8 h-8 text-yellow-500" />
            <DialogTitle className="text-xl font-bold text-center">
              Upgrade para Premium
            </DialogTitle>
          </div>
          <DialogDescription className="text-center text-base leading-relaxed">
            Para continuar utilizando todas as funcionalidades, ative seu plano por{' '}
            <span className="font-bold text-green-600">R$ 39,90/mês</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">O que você terá:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>✓ Agendamentos ilimitados</li>
              <li>✓ Gerenciamento completo de clientes</li>
              <li>✓ Página pública personalizada</li>
              <li>✓ Relatórios e estatísticas</li>
              <li>✓ Suporte prioritário</li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleActivatePlan}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Ativar Plano - R$ 39,90/mês
            </Button>
            
            <Button 
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Continuar no modo demonstração
            </Button>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 text-center mt-4">
          Pagamento seguro processado pelo Stripe. Cancele a qualquer momento.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;
