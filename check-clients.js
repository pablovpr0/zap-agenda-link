// Verificar estrutura da tabela clients
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mjufryrwcedazffgxbws.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdWZyeXJ3Y2VkYXpmZmd4YndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTQyMjEsImV4cCI6MjA2NzM5MDIyMX0.eVDDrGPjXt4lLwuT2XI1o5OMPbBIdxww4VwgDjCT0jo";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkClients() {
  console.log('🔍 Verificando estrutura da tabela clients...');
  
  try {
    // Verificar alguns clientes existentes
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .limit(3);

    if (error) {
      console.error('❌ Erro:', error);
      return;
    }

    console.log('📋 Primeiros 3 clientes:');
    clients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.name} - ${client.phone} - normalized: ${client.normalized_phone}`);
    });

    // Verificar se já existe algum cliente com o telefone de teste
    console.log('\n🔍 Verificando clientes existentes com telefone de teste...');
    const { data: testClients, error: testError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', '21a30258-691c-4d13-bdb6-ac9bb86398ee')
      .eq('normalized_phone', '11999998888');

    if (testError) {
      console.error('❌ Erro:', testError);
    } else {
      console.log('📱 Clientes com telefone teste encontrados:', testClients.length);
      testClients.forEach(client => {
        console.log(`- ${client.name} (${client.id}) - ${client.phone}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkClients();