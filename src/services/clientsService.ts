import { getStorageData, MockClient, STORAGE_KEYS } from '@/data/mockData';

export const fetchTotalClients = async (userId: string): Promise<number> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const clients = getStorageData<MockClient[]>(STORAGE_KEYS.CLIENTS, []);
  const userClients = clients.filter(client => client.company_id === userId);
  
  console.log('Total de clientes encontrados:', userClients.length);
  return userClients.length;
};