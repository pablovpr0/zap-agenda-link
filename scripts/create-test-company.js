import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mjufryrwcedazffgxbws.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdWZyeXJ3Y2VkYXpmZmd4YndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTQyMjEsImV4cCI6MjA2NzM5MDIyMX0.eVDDrGPjXt4lLwuT2XI1o5OMPbBIdxww4VwgDjCT0jo";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function createTestCompany() {
  try {
    console.log('🚀 Criando empresa de teste "pablo"...');
    
    const companyId = '550e8400-e29b-41d4-a716-446655440000';
    
    // 1. Inserir perfil da empresa
    console.log('📝 Inserindo perfil da empresa...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: companyId,
        company_name: 'Barbearia do Pablo',
        business_type: 'Barbearia',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao inserir perfil:', profileError);
      return;
    }
    console.log('✅ Perfil criado:', profile);
    
    // 2. Inserir configurações da empresa
    console.log('⚙️ Inserindo configurações da empresa...');
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
        welcome_message: 'Bem-vindo à Barbearia do Pablo! Agende seu horário e venha cuidar do seu visual.',
        lunch_break_enabled: true,
        lunch_start_time: '12:00:00',
        lunch_end_time: '13:00:00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (settingsError) {
      console.error('❌ Erro ao inserir configurações:', settingsError);
      return;
    }
    console.log('✅ Configurações criadas:', settings);
    
    // 3. Inserir serviços
    console.log('💼 Inserindo serviços...');
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
      },
      {
        company_id: companyId,
        name: 'Corte + Barba',
        description: 'Pacote completo: corte de cabelo e barba',
        duration: 45,
        price: 35.00,
        is_active: true
      }
    ];
    
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .upsert(services)
      .select();
    
    if (servicesError) {
      console.error('❌ Erro ao inserir serviços:', servicesError);
      return;
    }
    console.log('✅ Serviços criados:', servicesData);
    
    // 4. Inserir profissional
    console.log('👨‍💼 Inserindo profissional...');
    const { data: professional, error: professionalError } = await supabase
      .from('professionals')
      .upsert({
        company_id: companyId,
        name: 'Pablo Silva',
        phone: '(11) 99999-9999',
        role: 'Barbeiro',
        is_active: true
      })
      .select()
      .single();
    
    if (professionalError) {
      console.error('❌ Erro ao inserir profissional:', professionalError);
      return;
    }
    console.log('✅ Profissional criado:', professional);
    
    console.log('🎉 Empresa de teste "pablo" criada com sucesso!');
    console.log('🔗 Acesse: http://localhost:8081/pablo');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTestCompany();