
import { supabase } from '@/integrations/supabase/client';

export const fetchCompanySettings = async (userId: string) => {
  console.log('Fetching company settings for user:', userId);
  
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('company_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching company settings:', error);
      throw new Error('Erro ao buscar configurações da empresa');
    }

    return data;
  } catch (error: any) {
    console.error('Service error in fetchCompanySettings:', error);
    throw new Error(error.message || 'Erro ao buscar configurações da empresa');
  }
};

export const createDefaultSettings = async (userId: string, companyName: string): Promise<void> => {
  console.log('Creating default settings for user:', userId, 'company:', companyName);
  
  try {
    // Check if settings already exist
    const existingSettings = await fetchCompanySettings(userId);
    if (existingSettings) {
      console.log('Company settings already exist, skipping creation');
      return;
    }

    const slug = await generateUniqueSlug(companyName);
    
    const defaultSettings = {
      company_id: userId,
      slug,
      working_days: [1, 2, 3, 4, 5], // Monday to Friday
      working_hours_start: '09:00:00',
      working_hours_end: '18:00:00',
      appointment_interval: 60,
      advance_booking_limit: 30,
      monthly_appointments_limit: 10
    };

    const { error } = await supabase
      .from('company_settings')
      .insert(defaultSettings);

    if (error) {
      console.error('Error creating company settings:', error);
      throw new Error('Erro ao criar configurações da empresa');
    }

    console.log('Default settings created successfully with slug:', slug);
  } catch (error: any) {
    console.error('Service error in createDefaultSettings:', error);
    throw new Error(error.message || 'Erro ao criar configurações da empresa');
  }
};

export const generateUniqueSlug = async (companyName: string): Promise<string> => {
  try {
    let slug = companyName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50); // Limit length

    // Ensure slug is not empty
    if (!slug) {
      slug = 'empresa';
    }

    let counter = 0;
    let finalSlug = slug;
    
    while (await isSlugTaken(finalSlug)) {
      counter++;
      finalSlug = `${slug}-${counter}`;
    }

    return finalSlug;
  } catch (error: any) {
    console.error('Error generating unique slug:', error);
    // Return a fallback slug
    return `empresa-${Date.now()}`;
  }
};

export const isSlugTaken = async (slug: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Error checking slug availability:', error);
      return false; // Assume available if error
    }

    return data !== null;
  } catch (error: any) {
    console.error('Service error in isSlugTaken:', error);
    return false; // Assume available if error
  }
};

export const updateCompanySlug = async (userId: string, newSlug: string): Promise<boolean> => {
  try {
    const validation = validateSlug(newSlug);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    if (await isSlugTaken(newSlug)) {
      throw new Error('Este slug já está em uso por outra empresa');
    }

    const { error } = await supabase
      .from('company_settings')
      .update({ slug: newSlug })
      .eq('company_id', userId);

    if (error) {
      console.error('Error updating company slug:', error);
      throw new Error('Erro ao atualizar slug da empresa');
    }

    return true;
  } catch (error: any) {
    console.error('Service error in updateCompanySlug:', error);
    throw new Error(error.message || 'Erro ao atualizar slug da empresa');
  }
};

export const validateSlug = (slug: string): { isValid: boolean; error?: string } => {
  if (!slug || slug.length < 3) {
    return { isValid: false, error: 'Slug deve ter pelo menos 3 caracteres' };
  }

  if (slug.length > 50) {
    return { isValid: false, error: 'Slug deve ter no máximo 50 caracteres' };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { isValid: false, error: 'Slug pode conter apenas letras minúsculas, números e hífens' };
  }

  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { isValid: false, error: 'Slug não pode começar ou terminar com hífen' };
  }

  if (slug.includes('--')) {
    return { isValid: false, error: 'Slug não pode conter hífens consecutivos' };
  }

  const reservedWords = ['admin', 'api', 'www', 'mail', 'ftp', 'localhost', 'root', 'support', 'help'];
  if (reservedWords.includes(slug)) {
    return { isValid: false, error: 'Este slug é uma palavra reservada' };
  }

  return { isValid: true };
};
