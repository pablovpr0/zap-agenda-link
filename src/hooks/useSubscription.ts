
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { devLog, devError } from '@/utils/console';

interface SubscriptionData {
  subscribed: boolean;
  status: string;
  current_period_end: string | null;
  loading: boolean;
  isAdmin: boolean;
}

export const useSubscription = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    subscribed: false,
    status: 'inactive',
    current_period_end: null,
    loading: true,
    isAdmin: false,
  });

  const checkSubscription = async () => {
    if (!user || !session) {
      setSubscriptionData({
        subscribed: false,
        status: 'inactive',
        current_period_end: null,
        loading: false,
        isAdmin: false,
      });
      return;
    }

    try {
      // Primeiro, verificar se o usuário é admin
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      const isAdmin = profileData?.is_admin || false;

      // Se o usuário é admin, liberar acesso automaticamente
      if (isAdmin) {
        devLog('👑 Usuário é admin - liberando acesso automaticamente');
        setSubscriptionData({
          subscribed: true,
          status: 'active',
          current_period_end: null, // Admin não tem período de expiração
          loading: false,
          isAdmin: true,
        });
        return;
      }

      // Se não é admin, verificar assinatura normalmente
      devLog('🔍 Verificando status da assinatura...');
      
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        devError('❌ Erro ao verificar assinatura:', error);
        throw error;
      }

      devLog('✅ Status da assinatura:', data);
      
      setSubscriptionData({
        subscribed: data.subscribed || false,
        status: data.status || 'inactive',
        current_period_end: data.current_period_end || null,
        loading: false,
        isAdmin: false,
      });

    } catch (error) {
      devError('❌ Erro ao verificar assinatura:', error);
      setSubscriptionData({
        subscribed: false,
        status: 'inactive',
        current_period_end: null,
        loading: false,
        isAdmin: false,
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

    // Se o usuário é admin, não precisa fazer checkout
    if (subscriptionData.isAdmin) {
      toast({
        title: "Acesso já liberado",
        description: "Como administrador, você já tem acesso completo ao sistema.",
      });
      return;
    }

    try {
      devLog('🛒 Criando sessão de checkout...');
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        devError('❌ Erro ao criar checkout:', error);
        
        // Se o erro indica que é admin, mostrar mensagem apropriada
        if (error.message?.includes("Admin users don't need to subscribe")) {
          toast({
            title: "Acesso já liberado",
            description: "Como administrador, você já tem acesso completo ao sistema.",
          });
          return;
        }
        
        throw error;
      }

      devLog('✅ Checkout criado:', data.url);
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
      
    } catch (error) {
      devError('❌ Erro ao criar checkout:', error);
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
    isActive: (subscriptionData.subscribed && subscriptionData.status === 'active') || subscriptionData.isAdmin,
    isDemoMode: (!subscriptionData.subscribed || subscriptionData.status !== 'active') && !subscriptionData.isAdmin,
  };
};
