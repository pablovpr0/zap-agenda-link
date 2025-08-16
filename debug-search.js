// Debug da busca de clientes
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mjufryrwcedazffgxbws.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdWZyeXJ3Y2VkYXpmZmd4YndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTQyMjEsImV4cCI6MjA2NzM5MDIyMX0.eVDDrGPjXt4lLwuT2XI1o5OMPbBIdxww4VwgDjCT0jo";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugSearch() {
  console.log('🔍 Debug da busca de clientes...');
  
  const testCompanyId = '21a30258-691c-4d13-bdb6-ac9bb86398ee';
  
  try {
    console.log('\n1. 📋 Verificando todos os clientes existentes...');
    const { data: allClients, error: allError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', testCompanyId);
    
    if (allError) {
      console.error('❌ Erro:', allError);
      return;
    }

    console.log(`📊 Total de clientes na empresa: ${allClients.length}`);
    allClients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.name} - ${client.phone} - normalized: "${client.normalized_phone}" (ID: ${client.id})`);
    });

    if (allClients.length > 0) {
      const firstClient = allClients[0];
      console.log(`\n2. 🔍 Testando busca pelo primeiro cliente...`);
      console.log(`   - Telefone original: "${firstClient.phone}"`);
      console.log(`   - Telefone normalizado: "${firstClient.normalized_phone}"`);

      // Tentar buscar usando o normalized_phone
      const { data: foundClients, error: searchError } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', testCompanyId)
        .eq('normalized_phone', firstClient.normalized_phone);

      if (searchError) {
        console.error('❌ Erro na busca:', searchError);
      } else {
        console.log(`✅ Clientes encontrados na busca: ${foundClients.length}`);
        foundClients.forEach(client => {
          console.log(`   - ${client.name} (${client.id})`);
        });
      }

      // Testar busca com diferentes variações
      console.log(`\n3. 🔍 Testando diferentes tipos de busca...`);
      
      const variations = [
        firstClient.normalized_phone,
        firstClient.normalized_phone.trim(),
        firstClient.normalized_phone.toString()
      ];

      for (const variation of variations) {
        const { data: results } = await supabase
          .from('clients')
          .select('id, name, normalized_phone')
          .eq('company_id', testCompanyId)
          .eq('normalized_phone', variation);
        
        console.log(`   - Busca "${variation}": ${results?.length || 0} resultados`);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debugSearch();