
import { supabase } from '@/integrations/supabase/client';

export const fetchTotalClients = async (userId: string): Promise<number> => {
  const { data: clientsData, error } = await supabase
    .from('clients')
    .select('id')
    .eq('company_id', userId);

  if (error) {
    console.error('Erro ao buscar clientes:', error);
    throw error;
  }

  console.log('Total de clientes encontrados:', clientsData?.length || 0);
  return clientsData?.length || 0;
};
