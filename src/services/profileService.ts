
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  company_name?: string;
  business_type?: string;
  profile_image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  console.log('Fetching profile for user:', userId);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      throw new Error(`Erro ao buscar perfil: ${error.message}`);
    }

    console.log('Profile fetched successfully:', data);
    return data;
  } catch (error: any) {
    console.error('Service error in fetchProfile:', error);
    throw error;
  }
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile> => {
  console.log('Updating profile for user:', userId, 'with updates:', updates);
  
  try {
    // Primeiro verifica se o perfil existe
    const existingProfile = await fetchProfile(userId);
    
    if (!existingProfile) {
      console.log('Profile does not exist, creating new one');
      return await createProfile(userId, updates);
    }

    // Atualiza o perfil existente
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw new Error(`Erro ao atualizar perfil: ${error.message}`);
    }

    console.log('Profile updated successfully:', data);
    return data;
  } catch (error: any) {
    console.error('Service error in updateProfile:', error);
    throw error;
  }
};

export const createProfile = async (userId: string, profileData: Partial<Profile>): Promise<Profile> => {
  console.log('Creating profile for user:', userId, 'with data:', profileData);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      throw new Error(`Erro ao criar perfil: ${error.message}`);
    }

    console.log('Profile created successfully:', data);
    return data;
  } catch (error: any) {
    console.error('Service error in createProfile:', error);
    throw error;
  }
};

export const upsertProfile = async (userId: string, profileData: Partial<Profile>): Promise<Profile> => {
  console.log('Upserting profile for user:', userId, 'with data:', profileData);
  
  try {
    // Usa upsert nativo do Supabase para evitar condições de corrida
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting profile:', error);
      throw new Error(`Erro ao salvar perfil: ${error.message}`);
    }

    console.log('Profile upserted successfully:', data);
    return data;
  } catch (error: any) {
    console.error('Error in upsertProfile:', error);
    throw error;
  }
};
