// Debug final da busca
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mjufryrwcedazffgxbws.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdWZyeXJ3Y2VkYXpmZmd4YndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTQyMjEsImV4cCI6MjA2NzM5MDIyMX0.eVDDrGPjXt4lLwuT2XI1o5OMPbBIdxww4VwgDjCT0jo";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugFinalIssue() {
  console.log('🔍 Debug final da questão...');
  
  const testCompanyId = '21a30258-691c-4d13-bdb6-ac9bb86398ee';
  
  try {
    // 1. Verificar todos os clientes existentes
    console.log('\n1. 📋 Verificando todos os clientes existentes na empresa...');
    const { data: allClients, error: allError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', testCompanyId);
    
    if (allError) {
      console.error('❌ Erro:', allError);
      return;
    }

    console.log(`📊 Total de clientes: ${allClients.length}`);
    allClients.forEach((client, index) => {
      console.log(`${index + 1}. "${client.name}" - phone: "${client.phone}" - normalized: "${client.normalized_phone}" (ID: ${client.id})`);
    });

    if (allClients.length > 0) {
      const testClient = allClients[0];
      console.log(`\n2. 🔍 Testando busca com cliente existente...`);
      console.log(`   - Testando com normalized_phone: "${testClient.normalized_phone}"`);

      // Tentar várias formas de busca
      const searchVariations = [
        { field: 'normalized_phone', value: testClient.normalized_phone },
        { field: 'phone', value: testClient.phone },
        { field: 'name', value: testClient.name }
      ];

      for (const search of searchVariations) {
        const { data: results, error: searchError } = await supabase
          .from('clients')
          .select('id, name, phone, normalized_phone')
          .eq('company_id', testCompanyId)
          .eq(search.field, search.value);

        if (searchError) {
          console.log(`   ❌ Busca por ${search.field}="${search.value}": ERRO - ${searchError.message}`);
        } else {
          console.log(`   ✅ Busca por ${search.field}="${search.value}": ${results.length} resultado(s)`);
        }
      }

      // Busca específica que está falhando
      console.log(`\n3. 🔍 Testando busca exata que está falhando...`);
      const { data: exactSearch, error: exactError } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', testCompanyId)
        .eq('normalized_phone', testClient.normalized_phone)
        .order('created_at', { ascending: false })
        .limit(1);

      if (exactError) {
        console.log(`   ❌ Busca exata: ERRO - ${exactError.message}`);
      } else {
        console.log(`   ✅ Busca exata: ${exactSearch.length} resultado(s)`);
        if (exactSearch.length > 0) {
          console.log(`      - Nome: ${exactSearch[0].name}`);
          console.log(`      - ID: ${exactSearch[0].id}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debugFinalIssue();