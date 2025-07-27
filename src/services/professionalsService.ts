import { getStorageData, setStorageData, MockProfessional, STORAGE_KEYS } from '@/data/mockData';

export interface Professional {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  role: string;
  is_active: boolean;
}

export const fetchProfessionals = async (companyId: string): Promise<Professional[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const professionals = getStorageData<MockProfessional[]>(STORAGE_KEYS.PROFESSIONALS, []);
  const userProfessionals = professionals.filter(
    professional => professional.company_id === companyId && professional.is_active
  );

  console.log('Profissionais encontrados:', userProfessionals.length);
  return userProfessionals;
};

export const createProfessional = async (companyId: string, professional: Omit<Professional, 'id' | 'is_active'>) => {
  const professionals = getStorageData<MockProfessional[]>(STORAGE_KEYS.PROFESSIONALS, []);
  
  const newProfessional: MockProfessional = {
    id: `professional-${Date.now()}`,
    company_id: companyId,
    name: professional.name,
    phone: professional.phone,
    whatsapp: professional.whatsapp,
    role: professional.role,
    is_active: true
  };

  professionals.push(newProfessional);
  setStorageData(STORAGE_KEYS.PROFESSIONALS, professionals);

  return newProfessional;
};

export const updateProfessional = async (professionalId: string, professional: Partial<Professional>) => {
  const professionals = getStorageData<MockProfessional[]>(STORAGE_KEYS.PROFESSIONALS, []);
  
  const updatedProfessionals = professionals.map(p =>
    p.id === professionalId
      ? {
          ...p,
          name: professional.name || p.name,
          phone: professional.phone || p.phone,
          whatsapp: professional.whatsapp || p.whatsapp,
          role: professional.role || p.role,
          is_active: professional.is_active !== undefined ? professional.is_active : p.is_active
        }
      : p
  );

  setStorageData(STORAGE_KEYS.PROFESSIONALS, updatedProfessionals);
  
  const updatedProfessional = updatedProfessionals.find(p => p.id === professionalId);
  return updatedProfessional;
};

export const deleteProfessional = async (professionalId: string) => {
  const professionals = getStorageData<MockProfessional[]>(STORAGE_KEYS.PROFESSIONALS, []);
  
  const updatedProfessionals = professionals.map(p =>
    p.id === professionalId ? { ...p, is_active: false } : p
  );

  setStorageData(STORAGE_KEYS.PROFESSIONALS, updatedProfessionals);
};