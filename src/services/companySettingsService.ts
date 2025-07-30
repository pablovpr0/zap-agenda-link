
import { supabase } from '@/integrations/supabase/client';

export const fetchCompanySettings = async (userId: string) => {
  console.log('🔍 fetchCompanySettings: Buscando configurações para usuário:', userId);
  
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('company_id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ fetchCompanySettings: Erro:', error);
      throw new Error(`Erro ao buscar configurações: ${error.message}`);
    }

    console.log('✅ fetchCompanySettings: Configurações encontradas:', data);
    return data;
  } catch (error: any) {
    console.error('❌ fetchCompanySettings: Erro no serviço:', error);
    throw error;
  }
};

export const createDefaultSettings = async (userId: string, companyName: string): Promise<void> => {
  console.log('🚀 createDefaultSettings: Criando configurações padrão para:', userId, companyName);
  
  try {
    // Verificar se já existem configurações
    const existingSettings = await fetchCompanySettings(userId);
    if (existingSettings) {
      console.log('ℹ️ createDefaultSettings: Configurações já existem, pulando criação');
      return;
    }

    // Gerar slug único
    const slug = await generateUniqueSlug(companyName);
    console.log('📝 createDefaultSettings: Slug gerado:', slug);
    
    const defaultSettings = {
      company_id: userId,
      slug,
      working_days: [1, 2, 3, 4, 5], // Segunda a Sexta
      working_hours_start: '09:00:00',
      working_hours_end: '18:00:00',
      appointment_interval: 30,
      advance_booking_limit: 30,
      monthly_appointments_limit: 10,
      status_aberto: true,
      lunch_break_enabled: false,
      lunch_start_time: '12:00:00',
      lunch_end_time: '13:00:00'
    };

    const { error } = await supabase
      .from('company_settings')
      .insert(defaultSettings);

    if (error) {
      console.error('❌ createDefaultSettings: Erro ao inserir:', error);
      throw new Error(`Erro ao criar configurações: ${error.message}`);
    }

    console.log('✅ createDefaultSettings: Configurações criadas com sucesso');
  } catch (error: any) {
    console.error('❌ createDefaultSettings: Erro no serviço:', error);
    throw error;
  }
};

export const generateUniqueSlug = async (companyName: string): Promise<string> => {
  try {
    // Criar slug base
    let slug = companyName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]/g, '-') // Substitui caracteres especiais por hífen
      .replace(/-+/g, '-') // Remove hífens consecutivos
      .replace(/^-|-$/g, '') // Remove hífens do início e fim
      .substring(0, 50); // Limita tamanho

    // Garantir que não está vazio
    if (!slug) {
      slug = 'empresa';
    }

    let counter = 0;
    let finalSlug = slug;
    
    // Verificar se o slug já existe
    while (await isSlugTaken(finalSlug)) {
      counter++;
      finalSlug = `${slug}-${counter}`;
    }

    return finalSlug;
  } catch (error: any) {
    console.error('❌ generateUniqueSlug: Erro:', error);
    // Retornar slug de fallback em caso de erro
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
      console.error('⚠️ isSlugTaken: Erro ao verificar slug:', error);
      return false; // Assumir disponível se houver erro
    }

    return data !== null;
  } catch (error: any) {
    console.error('❌ isSlugTaken: Erro no serviço:', error);
    return false; // Assumir disponível se houver erro
  }
};

export const updateCompanySlug = async (userId: string, newSlug: string): Promise<boolean> => {
  try {
    // Validar slug
    const validation = validateSlug(newSlug);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Verificar se já está em uso
    if (await isSlugTaken(newSlug)) {
      throw new Error('Este slug já está em uso por outra empresa');
    }

    const { error } = await supabase
      .from('company_settings')
      .update({ slug: newSlug })
      .eq('company_id', userId);

    if (error) {
      console.error('❌ updateCompanySlug: Erro ao atualizar:', error);
      throw new Error(`Erro ao atualizar slug: ${error.message}`);
    }

    console.log('✅ updateCompanySlug: Slug atualizado com sucesso');
    return true;
  } catch (error: any) {
    console.error('❌ updateCompanySlug: Erro no serviço:', error);
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
