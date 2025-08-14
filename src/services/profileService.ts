
import { supabase } from '@/integrations/supabase/client';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

export interface Profile {
  id: string;
  company_name?: string;
  business_type?: string;
  profile_image_url?: string;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  devLog('🔍 fetchProfile: Buscando perfil para usuário:', userId);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      devError('❌ fetchProfile: Erro:', error);
      throw new Error(`Erro ao buscar perfil: ${error.message}`);
    }

    devLog('✅ fetchProfile: Perfil encontrado:', data ? 'Sim' : 'Não');
    return data;
  } catch (error: any) {
    devError('❌ fetchProfile: Erro no serviço:', error);
    throw error;
  }
};

export const upsertProfile = async (userId: string, profileData: Partial<Profile>): Promise<Profile> => {
  devLog('🚀 upsertProfile: Salvando perfil para usuário:', userId);
  devLog('📝 upsertProfile: Dados:', profileData);
  
  try {
    // Preparar dados para upsert
    const dataToUpsert = {
      id: userId,
      ...profileData,
      updated_at: new Date().toISOString()
    };

    // Usar upsert nativo do Supabase para evitar condições de corrida
    const { data, error } = await supabase
      .from('profiles')
      .upsert(dataToUpsert, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) {
      devError('❌ upsertProfile: Erro ao salvar:', error);
      throw new Error(`Erro ao salvar perfil: ${error.message}`);
    }

    devLog('✅ upsertProfile: Perfil salvo com sucesso');
    return data;
  } catch (error: any) {
    devError('❌ upsertProfile: Erro no serviço:', error);
    throw error;
  }
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile> => {
  devLog('🔄 updateProfile: Atualizando perfil para usuário:', userId);
  
  return upsertProfile(userId, updates);
};

export const createProfile = async (userId: string, profileData: Partial<Profile>): Promise<Profile> => {
  devLog('➕ createProfile: Criando perfil para usuário:', userId);
  
  return upsertProfile(userId, profileData);
};
