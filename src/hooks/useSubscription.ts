
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionData {
  subscribed: boolean;
  status: string;
  current_period_end: string | null;
  loading: boolean;
}

export const useSubscription = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    subscribed: false,
    status: 'inactive',
    current_period_end: null,
    loading: true,
  });

  const checkSubscription = async () => {
    if (!user || !session) {
      setSubscriptionData({
        subscribed: false,
        status: 'inactive',
        current_period_end: null,
        loading: false,
      });
      return;
    }

    try {
      console.log('🔍 Verificando status da assinatura...');
      
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('❌ Erro ao verificar assinatura:', error);
        throw error;
      }

      console.log('✅ Status da assinatura:', data);
      
      setSubscriptionData({
        subscribed: data.subscribed || false,
        status: data.status || 'inactive',
        current_period_end: data.current_period_end || null,
        loading: false,
      });

    } catch (error) {
      console.error('❌ Erro ao verificar assinatura:', error);
      setSubscriptionData({
        subscribed: false,
        status: 'inactive',
        current_period_end: null,
        loading: false,
      });
    }
  };

  const createCheckout = async () => {
    if (!session) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para assinar o plano.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🛒 Criando sessão de checkout...');
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('❌ Erro ao criar checkout:', error);
        throw error;
      }

      console.log('✅ Checkout criado:', data.url);
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
      
    } catch (error) {
      console.error('❌ Erro ao criar checkout:', error);
      toast({
        title: "Erro no pagamento",
        description: "Não foi possível iniciar o processo de pagamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Check subscription on user change
  useEffect(() => {
    checkSubscription();
  }, [user, session]);

  // Check for success/cancelled URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const subscriptionStatus = urlParams.get('subscription');
    
    if (subscriptionStatus === 'success') {
      toast({
        title: "Pagamento realizado com sucesso!",
        description: "Sua assinatura foi ativada. Bem-vindo ao ZapAgenda Premium!",
      });
      
      // Remove URL params and refresh subscription
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        checkSubscription();
      }, 2000);
    } else if (subscriptionStatus === 'cancelled') {
      toast({
        title: "Pagamento cancelado",
        description: "O processo de pagamento foi cancelado. Você pode tentar novamente quando quiser.",
        variant: "destructive",
      });
      
      // Remove URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return {
    ...subscriptionData,
    checkSubscription,
    createCheckout,
    isActive: subscriptionData.subscribed && subscriptionData.status === 'active',
    isDemoMode: !subscriptionData.subscribed || subscriptionData.status !== 'active',
  };
};
