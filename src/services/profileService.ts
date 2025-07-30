
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
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    throw new Error('Erro ao buscar perfil do usuário');
  }

  return data;
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile> => {
  console.log('Updating profile for user:', userId, 'with updates:', updates);
  
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
    throw new Error('Erro ao atualizar perfil do usuário');
  }

  return data;
};

export const createProfile = async (userId: string, profileData: Partial<Profile>): Promise<Profile> => {
  console.log('Creating profile for user:', userId, 'with data:', profileData);
  
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      ...profileData,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    throw new Error('Erro ao criar perfil do usuário');
  }

  return data;
};

export const upsertProfile = async (userId: string, profileData: Partial<Profile>): Promise<Profile> => {
  console.log('Upserting profile for user:', userId, 'with data:', profileData);
  
  try {
    // First try to update existing profile
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (updateError && updateError.code !== 'PGRST116') {
      console.error('Error updating profile:', updateError);
      throw new Error('Erro ao atualizar perfil do usuário');
    }

    // If update succeeded and returned data, return it
    if (updateData) {
      console.log('Profile updated successfully:', updateData);
      return updateData;
    }

    // If no rows were updated, try to insert
    console.log('No existing profile found, creating new one');
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating profile:', insertError);
      throw new Error('Erro ao criar perfil do usuário');
    }

    console.log('Profile created successfully:', insertData);
    return insertData;

  } catch (error: any) {
    console.error('Error in upsertProfile:', error);
    throw new Error(error.message || 'Erro ao salvar perfil do usuário');
  }
};
