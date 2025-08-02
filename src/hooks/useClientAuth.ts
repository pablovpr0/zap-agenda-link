import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ClientData {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export const useClientAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentClient, setCurrentClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(false);

  // Verificar se cliente está logado ao inicializar
  useEffect(() => {
    const savedClient = localStorage.getItem('zapagenda_client');
    if (savedClient) {
      try {
        const clientData = JSON.parse(savedClient);
        setCurrentClient(clientData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Erro ao recuperar dados do cliente:', error);
        localStorage.removeItem('zapagenda_client');
      }
    }
  }, []);

  const loginWithPhone = async (phone: string, companyId: string) => {
    setLoading(true);
    try {
      // Verificar se cliente já existe
      const { data: existingClient, error } = await supabase
        .from('clients')
        .select('*')
        .eq('phone', phone)
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (existingClient) {
        // Cliente existente - fazer login
        const clientData = {
          id: existingClient.id,
          name: existingClient.name,
          phone: existingClient.phone,
          email: existingClient.email
        };
        
        setCurrentClient(clientData);
        setIsAuthenticated(true);
        localStorage.setItem('zapagenda_client', JSON.stringify(clientData));
        
        return { isFirstTime: false, client: clientData };
      } else {
        // Primeiro acesso - apenas armazenar telefone
        localStorage.setItem('zapagenda_temp_phone', phone);
        return { isFirstTime: true, phone };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = (clientData: ClientData) => {
    setCurrentClient(clientData);
    setIsAuthenticated(true);
    localStorage.setItem('zapagenda_client', JSON.stringify(clientData));
    localStorage.removeItem('zapagenda_temp_phone');
  };

  const updateClientData = (clientData: ClientData) => {
    setCurrentClient(clientData);
    localStorage.setItem('zapagenda_client', JSON.stringify(clientData));
  };

  const logout = () => {
    setCurrentClient(null);
    setIsAuthenticated(false);
    localStorage.removeItem('zapagenda_client');
    localStorage.removeItem('zapagenda_temp_phone');
  };

  const getTempPhone = () => {
    return localStorage.getItem('zapagenda_temp_phone');
  };

  return {
    isAuthenticated,
    currentClient,
    loading,
    loginWithPhone,
    completeRegistration,
    updateClientData,
    logout,
    getTempPhone
  };
};