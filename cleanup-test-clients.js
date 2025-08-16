// Limpar clientes de teste
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mjufryrwcedazffgxbws.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdWZyeXJ3Y2VkYXpmZmd4YndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTQyMjEsImV4cCI6MjA2NzM5MDIyMX0.eVDDrGPjXt4lLwuT2XI1o5OMPbBIdxww4VwgDjCT0jo";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanup() {
  console.log('🧹 Limpando clientes de teste...');
  
  const testCompanyId = '21a30258-691c-4d13-bdb6-ac9bb86398ee';
  const testPhone = '11999998888';
  
  try {
    // Buscar todos os clientes de teste
    const { data: testClients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', testCompanyId)
      .eq('normalized_phone', testPhone);

    if (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      return;
    }

    console.log(`📋 Encontrados ${testClients.length} clientes de teste:`);
    testClients.forEach(client => {
      console.log(`- ${client.name} (${client.id}) - ${client.phone}`);
    });

    if (testClients.length > 0) {
      // Deletar todos os clientes de teste
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('company_id', testCompanyId)
        .eq('normalized_phone', testPhone);

      if (deleteError) {
        console.error('❌ Erro ao deletar clientes:', deleteError);
      } else {
        console.log(`✅ ${testClients.length} clientes de teste removidos`);
      }
    } else {
      console.log('✅ Nenhum cliente de teste encontrado');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

cleanup();