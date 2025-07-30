import { supabase } from '@/integrations/supabase/client';

export const testDatabaseConnection = async () => {
  try {
    console.log('🔍 Testando conexão com o banco de dados...');
    
    // Testar conexão básica
    const { data, error } = await supabase
      .from('company_settings')
      .select('slug, company_id')
      .limit(5);
    
    if (error) {
      console.error('❌ Erro na conexão:', error);
      return { success: false, error };
    }
    
    console.log('✅ Conexão OK. Empresas encontradas:', data);
    
    // Verificar especificamente a empresa "pablo"
    const { data: pabloData, error: pabloError } = await supabase
      .from('company_settings')
      .select('*')
      .eq('slug', 'pablo')
      .single();
    
    if (pabloError && pabloError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar pablo:', pabloError);
    } else if (pabloData) {
      console.log('✅ Empresa "pablo" encontrada:', pabloData);
    } else {
      console.log('⚠️ Empresa "pablo" não encontrada');
    }
    
    return { success: true, data, pabloData };
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return { success: false, error };
  }
};

export const createMinimalTestData = async () => {
  try {
    console.log('🚀 Criando dados mínimos de teste...');
    
    // Tentar inserir apenas as configurações da empresa (que tem política pública)
    const { data, error } = await supabase
      .from('company_settings')
      .upsert({
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        slug: 'pablo',
        working_days: [1, 2, 3, 4, 5, 6],
        working_hours_start: '09:00:00',
        working_hours_end: '18:00:00',
        appointment_interval: 30,
        max_simultaneous_appointments: 1,
        advance_booking_limit: 30,
        theme_color: '#22c55e',
        welcome_message: 'Bem-vindo à Barbearia do Pablo!'
      }, {
        onConflict: 'slug'
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar dados:', error);
      return { success: false, error };
    }
    
    console.log('✅ Dados criados:', data);
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return { success: false, error };
  }
};