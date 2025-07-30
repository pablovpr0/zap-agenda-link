
import { supabase } from '@/integrations/supabase/client';

export const fetchTotalClients = async (userId: string): Promise<number> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id')
    .eq('company_id', userId);

  if (error) {
    console.error('Erro ao buscar total de clientes:', error);
    return 0;
  }

  const totalClients = clients?.length || 0;
  console.log('Total de clientes encontrados:', totalClients);
  return totalClients;
};
