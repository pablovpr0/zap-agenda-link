
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
    
    const companySlug = companyName
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

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
