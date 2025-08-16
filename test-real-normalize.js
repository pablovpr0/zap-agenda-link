// Teste usando a função real de normalização
import { createClient } from '@supabase/supabase-js';

// Função copiada do phoneNormalization.ts
const normalizePhone = (phone) => {
  if (!phone) return '';
  
  let digitsOnly = phone.replace(/\D/g, '');
  
  // Remove prefixos comuns
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    digitsOnly = digitsOnly.substring(1);
  } else if ((digitsOnly.length === 13 || digitsOnly.length === 12) && digitsOnly.startsWith('55')) {
    digitsOnly = digitsOnly.substring(2);
  }
  
  return digitsOnly;
};

const SUPABASE_URL = "https://mjufryrwcedazffgxbws.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdWZyeXJ3Y2VkYXpmZmd4YndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTQyMjEsImV4cCI6MjA2NzM5MDIyMX0.eVDDrGPjXt4lLwuT2XI1o5OMPbBIdxww4VwgDjCT0jo";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testRealNormalize() {
  console.log('🔍 Testando com função real de normalização...');
  
  const testCompanyId = '21a30258-691c-4d13-bdb6-ac9bb86398ee';
  const testPhone = '(11) 99999-3333';
  const normalizedPhone = normalizePhone(testPhone);
  
  console.log(`📱 Telefone original: "${testPhone}"`);
  console.log(`📱 Telefone normalizado: "${normalizedPhone}"`);
  
  try {
    console.log('\n1. 🧹 Limpeza inicial...');
    await supabase
      .from('clients')
      .delete()
      .eq('company_id', testCompanyId)
      .or(`normalized_phone.eq.${normalizedPhone},normalized_phone.eq.55${normalizedPhone}`);

    console.log('\n2. 📱 Criando cliente...');
    
    const { data: newClient, error: createError } = await supabase
      .from('clients')
      .insert({
        company_id: testCompanyId,
        name: 'João Real',
        phone: testPhone,
        email: 'real@teste.com',
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
    console.log(`   - Normalizado enviado: "${normalizedPhone}"`);
    console.log(`   - Normalizado salvo: "${newClient.normalized_phone}"`);

    // Agora testar a busca com o valor que realmente foi salvo
    const savedNormalizedPhone = newClient.normalized_phone;
    
    console.log('\n3. 🔍 Buscando com valor salvo...');
    
    const { data: foundClients, error: searchError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', testCompanyId)
      .eq('normalized_phone', savedNormalizedPhone);

    if (searchError) {
      console.error('❌ Erro na busca:', searchError);
    } else {
      console.log(`✅ Busca com valor salvo retornou ${foundClients.length} cliente(s):`);
      foundClients.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.name} (ID: ${client.id})`);
      });
    }

    // Testar busca com valor que enviamos
    console.log('\n4. 🔍 Buscando com valor enviado...');
    
    const { data: foundClients2, error: searchError2 } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', testCompanyId)
      .eq('normalized_phone', normalizedPhone);

    if (searchError2) {
      console.error('❌ Erro na busca 2:', searchError2);
    } else {
      console.log(`✅ Busca com valor enviado retornou ${foundClients2.length} cliente(s):`);
    }

    // Limpeza
    console.log('\n5. 🧹 Limpeza final...');
    await supabase
      .from('clients')
      .delete()
      .eq('id', newClient.id);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testRealNormalize();