
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

interface ClientData {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

// Função para extrair apenas o primeiro nome
const extractFirstName = (fullName: string): string => {
  const names = fullName.trim().split(/\s+/);
  return names[0];
};

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
        devError('Erro ao recuperar dados do cliente:', error);
        localStorage.removeItem('zapagenda_client');
      }
    }
  }, []);

  const loginWithPhone = async (phone: string, companyId: string) => {
    setLoading(true);
    try {
      devLog('🔍 Buscando cliente pelo telefone:', phone);
      
      // Verificar se cliente já existe pelo telefone
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
        devLog('✅ Cliente encontrado:', existingClient.name);
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
        devLog('📱 Primeiro acesso para o telefone:', phone);
        localStorage.setItem('zapagenda_temp_phone', phone);
        return { isFirstTime: true, phone };
      }
    } catch (error) {
      devError('Erro no login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = (clientData: ClientData) => {
    // Salvar apenas o primeiro nome localmente também
    const firstName = extractFirstName(clientData.name);
    const updatedClientData = {
      ...clientData,
      name: firstName
    };
    
    devLog('📝 Completando registro com primeiro nome:', firstName);
    
    setCurrentClient(updatedClientData);
    setIsAuthenticated(true);
    localStorage.setItem('zapagenda_client', JSON.stringify(updatedClientData));
    localStorage.removeItem('zapagenda_temp_phone');
  };

  const updateClientData = (clientData: ClientData) => {
    // Manter apenas o primeiro nome ao atualizar
    const firstName = extractFirstName(clientData.name);
    const updatedClientData = {
      ...clientData,
      name: firstName
    };
    
    setCurrentClient(updatedClientData);
    localStorage.setItem('zapagenda_client', JSON.stringify(updatedClientData));
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
