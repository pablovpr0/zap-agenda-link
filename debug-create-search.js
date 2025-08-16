// Debug da criação e busca de clientes
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mjufryrwcedazffgxbws.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdWZyeXJ3Y2VkYXpmZmd4YndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTQyMjEsImV4cCI6MjA2NzM5MDIyMX0.eVDDrGPjXt4lLwuT2XI1o5OMPbBIdxww4VwgDjCT0jo";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function normalizePhone(phone) {
  return phone.replace(/\D/g, '');
}

async function debugCreateSearch() {
  console.log('🔍 Debug da criação e busca...');
  
  const testCompanyId = '21a30258-691c-4d13-bdb6-ac9bb86398ee';
  const testPhone = '(11) 99999-4444';
  const normalizedPhone = normalizePhone(testPhone);
  
  try {
    console.log('\n1. 🧹 Limpeza inicial...');
    await supabase
      .from('clients')
      .delete()
      .eq('company_id', testCompanyId)
      .eq('normalized_phone', normalizedPhone);

    console.log('\n2. 📱 Criando cliente...');
    console.log(`   - Telefone: "${testPhone}"`);
    console.log(`   - Normalizado: "${normalizedPhone}"`);
    
    const { data: newClient, error: createError } = await supabase
      .from('clients')
      .insert({
        company_id: testCompanyId,
        name: 'João Debug',
        phone: testPhone,
        email: 'debug@teste.com',
        normalized_phone: normalizedPhone
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar:', createError);
      return;
    }

    console.log('✅ Cliente criado:');
    console.log(`   - ID: ${newClient.id}`);
    console.log(`   - Nome: ${newClient.name}`);
    console.log(`   - Telefone: "${newClient.phone}"`);
    console.log(`   - Normalizado: "${newClient.normalized_phone}"`);

    console.log('\n3. 🔍 Tentando buscar o cliente imediatamente...');
    
    const { data: foundClients, error: searchError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', testCompanyId)
      .eq('normalized_phone', normalizedPhone);

    if (searchError) {
      console.error('❌ Erro na busca:', searchError);
    } else {
      console.log(`✅ Busca retornou ${foundClients.length} cliente(s):`);
      foundClients.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.name} - "${client.phone}" - normalized: "${client.normalized_phone}" (ID: ${client.id})`);
      });
    }

    console.log('\n4. 🔍 Aguardando 100ms e buscando novamente...');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const { data: foundClients2, error: searchError2 } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', testCompanyId)
      .eq('normalized_phone', normalizedPhone);

    if (searchError2) {
      console.error('❌ Erro na busca 2:', searchError2);
    } else {
      console.log(`✅ Segunda busca retornou ${foundClients2.length} cliente(s):`);
      foundClients2.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.name} - "${client.phone}" - normalized: "${client.normalized_phone}" (ID: ${client.id})`);
      });
    }

    // Tentativa de criar outro cliente com mesmo telefone
    console.log('\n5. 📱 Tentando criar segundo cliente com mesmo telefone...');
    
    const { data: duplicateClient, error: duplicateError } = await supabase
      .from('clients')
      .insert({
        company_id: testCompanyId,
        name: 'João Debug 2',
        phone: testPhone,
        email: 'debug2@teste.com',
        normalized_phone: normalizedPhone
      })
      .select()
      .single();

    if (duplicateError) {
      console.log('✅ Erro esperado ao criar duplicata:', duplicateError.message);
    } else {
      console.log('⚠️ Duplicata criada (não deveria):', duplicateClient.name);
    }

    // Limpeza
    console.log('\n6. 🧹 Limpeza final...');
    await supabase
      .from('clients')
      .delete()
      .eq('id', newClient.id);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debugCreateSearch();