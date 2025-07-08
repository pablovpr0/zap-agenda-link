
import { supabase } from '@/integrations/supabase/client';

export const fetchCompanySettings = async (userId: string) => {
  const { data: settings, error: settingsError } = await supabase
    .from('company_settings')
    .select('slug')
    .eq('company_id', userId)
    .single();

  if (settingsError) {
    console.error('Erro ao buscar configurações:', settingsError);
    throw settingsError;
  }

  return settings;
};

export const createDefaultSettings = async (userId: string, companyName: string) => {
  try {
    console.log('Criando configurações padrão para:', userId);
    
    const companySlug = await generateUniqueSlug(companyName);

    const { error } = await supabase
      .from('company_settings')
      .insert({
        company_id: userId,
        slug: companySlug,
        working_days: [1, 2, 3, 4, 5, 6],
        working_hours_start: '09:00',
        working_hours_end: '18:00',
        appointment_interval: 30,
        max_simultaneous_appointments: 1,
        advance_booking_limit: 30,
        theme_color: '#22c55e'
      });

    if (error) {
      console.error('Erro ao criar configurações:', error);
      throw error;
    }

    console.log('Configurações criadas com sucesso');
  } catch (error: any) {
    console.error('Erro ao criar configurações padrão:', error);
    throw error;
  }
};

export const generateUniqueSlug = async (companyName: string): Promise<string> => {
  // Gerar slug base a partir do nome da empresa
  let baseSlug = companyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens do início e fim

  // Garantir que o slug tenha pelo menos 3 caracteres
  if (baseSlug.length < 3) {
    baseSlug = `empresa-${Math.random().toString(36).substring(2, 8)}`;
  }

  let slug = baseSlug;
  let counter = 1;

  // Verificar se o slug já existe e gerar um único
  while (await isSlugTaken(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

export const isSlugTaken = async (slug: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('company_settings')
    .select('id')
    .eq('slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Erro ao verificar slug:', error);
    return false;
  }

  return !!data;
};

export const updateCompanySlug = async (userId: string, newSlug: string): Promise<boolean> => {
  try {
    // Validar formato do slug
    const isValidSlug = /^[a-z0-9-]{3,50}$/.test(newSlug);
    if (!isValidSlug) {
      throw new Error('Slug deve conter apenas letras minúsculas, números e hífens (3-50 caracteres)');
    }

    // Verificar se o slug já está em uso
    if (await isSlugTaken(newSlug)) {
      throw new Error('Este slug já está sendo usado por outra empresa');
    }

    // Atualizar o slug
    const { error } = await supabase
      .from('company_settings')
      .update({ 
        slug: newSlug,
        updated_at: new Date().toISOString()
      })
      .eq('company_id', userId);

    if (error) throw error;

    return true;
  } catch (error: any) {
    console.error('Erro ao atualizar slug:', error);
    throw error;
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
    return { isValid: false, error: 'Slug deve conter apenas letras minúsculas, números e hífens' };
  }

  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { isValid: false, error: 'Slug não pode começar ou terminar com hífen' };
  }

  if (slug.includes('--')) {
    return { isValid: false, error: 'Slug não pode conter hífens consecutivos' };
  }

  // Palavras reservadas
  const reservedWords = ['admin', 'api', 'www', 'app', 'mail', 'ftp', 'public', 'private'];
  if (reservedWords.includes(slug)) {
    return { isValid: false, error: 'Esta palavra é reservada e não pode ser usada' };
  }

  return { isValid: true };
};
