// Verificar todos os clientes da empresa de teste
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mjufryrwcedazffgxbws.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdWZyeXJ3Y2VkYXpmZmd4YndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTQyMjEsImV4cCI6MjA2NzM5MDIyMX0.eVDDrGPjXt4lLwuT2XI1o5OMPbBIdxww4VwgDjCT0jo";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAllClients() {
  console.log('🔍 Verificando todos os clientes...');
  
  const testCompanyId = '21a30258-691c-4d13-bdb6-ac9bb86398ee';
  
  try {
    // Buscar todos os clientes da empresa
    const { data: allClients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', testCompanyId);

    if (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      return;
    }

    console.log(`📋 Total de clientes na empresa: ${allClients.length}`);
    allClients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.name} - ${client.phone} - normalized: ${client.normalized_phone} (ID: ${client.id})`);
    });

    // Buscar especificamente pelo telefone normalizado de teste
    const { data: testPhoneClients, error: testError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', testCompanyId)
      .eq('normalized_phone', '11999998888');

    if (testError) {
      console.error('❌ Erro ao buscar por telefone:', testError);
    } else {
      console.log(`\n📱 Clientes com telefone 11999998888: ${testPhoneClients.length}`);
      testPhoneClients.forEach(client => {
        console.log(`- ${client.name} (${client.id}) - ${client.phone} - normalized: ${client.normalized_phone}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkAllClients();