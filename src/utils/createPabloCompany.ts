import { supabase } from '@/integrations/supabase/client';

export const createPabloCompany = async () => {
  try {
    console.log('🚀 Criando empresa Pablo...');
    
    const companyId = '550e8400-e29b-41d4-a716-446655440000';
    
    // 1. Criar configurações da empresa (isso deve funcionar pois tem política pública)
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .upsert({
        company_id: companyId,
        slug: 'pablo',
        working_days: [1, 2, 3, 4, 5, 6], // Segunda a sábado
        working_hours_start: '09:00:00',
        working_hours_end: '18:00:00',
        appointment_interval: 30,
        max_simultaneous_appointments: 1,
        advance_booking_limit: 30,
        theme_color: '#22c55e',
        welcome_message: 'Bem-vindo à Barbearia do Pablo! Agende seu horário.',
        lunch_break_enabled: true,
        lunch_start_time: '12:00:00',
        lunch_end_time: '13:00:00'
      }, {
        onConflict: 'slug'
      })
      .select()
      .single();
    
    if (settingsError) {
      console.error('❌ Erro ao criar configurações:', settingsError);
      throw settingsError;
    }
    
    console.log('✅ Configurações criadas:', settings);
    
    // 2. Tentar criar alguns serviços (pode falhar devido às políticas RLS)
    const services = [
      {
        company_id: companyId,
        name: 'Corte Masculino',
        description: 'Corte de cabelo masculino tradicional',
        duration: 30,
        price: 25.00,
        is_active: true
      },
      {
        company_id: companyId,
        name: 'Barba',
        description: 'Aparar e modelar barba',
        duration: 20,
        price: 15.00,
        is_active: true
      }
    ];
    
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .upsert(services, {
        onConflict: 'id'
      })
      .select();
    
    if (servicesError) {
      console.warn('⚠️ Erro ao criar serviços (não crítico):', servicesError);
    } else {
      console.log('✅ Serviços criados:', servicesData);
    }
    
    return {
      success: true,
      settings,
      services: servicesData || []
    };
    
  } catch (error) {
    console.error('❌ Erro ao criar empresa Pablo:', error);
    return {
      success: false,
      error
    };
  }
};

export const checkPabloCompany = async () => {
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select(`
        *,
        services:services(*)
      `)
      .eq('slug', 'pablo')
      .single();
    
    if (error) {
      console.error('❌ Erro ao verificar empresa Pablo:', error);
      return { exists: false, error };
    }
    
    console.log('✅ Empresa Pablo encontrada:', data);
    return { exists: true, data };
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return { exists: false, error };
  }
};