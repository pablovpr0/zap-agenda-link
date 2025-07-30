
import { supabase } from '@/integrations/supabase/client';

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
  
  const { data: professionals, error } = await supabase
    .from('professionals')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true);

  if (error) {
    console.error('Erro ao buscar profissionais:', error);
    return [];
  }

  console.log('Profissionais encontrados:', professionals?.length || 0);
  return professionals || [];
};

export const createProfessional = async (companyId: string, professional: Omit<Professional, 'id' | 'is_active'>) => {
  const { data: newProfessional, error } = await supabase
    .from('professionals')
    .insert({
      company_id: companyId,
      name: professional.name,
      phone: professional.phone,
      whatsapp: professional.whatsapp,
      role: professional.role,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar profissional:', error);
    throw new Error('Erro ao criar profissional');
  }

  return newProfessional;
};

export const updateProfessional = async (professionalId: string, professional: Partial<Professional>) => {
  const { data: updatedProfessional, error } = await supabase
    .from('professionals')
    .update({
      name: professional.name,
      phone: professional.phone,
      whatsapp: professional.whatsapp,
      role: professional.role,
      is_active: professional.is_active
    })
    .eq('id', professionalId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar profissional:', error);
    throw new Error('Erro ao atualizar profissional');
  }

  return updatedProfessional;
};

export const deleteProfessional = async (professionalId: string) => {
  const { error } = await supabase
    .from('professionals')
    .update({ is_active: false })
    .eq('id', professionalId);

  if (error) {
    console.error('Erro ao desativar profissional:', error);
    throw new Error('Erro ao desativar profissional');
  }
};
