// Teste para verificar o comportamento atual
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mjufryrwcedazffgxbws.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdWZyeXJ3Y2VkYXpmZmd4YndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTQyMjEsImV4cCI6MjA2NzM5MDIyMX0.eVDDrGPjXt4lLwuT2XI1o5OMPbBIdxww4VwgDjCT0jo";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Função de normalização atual (corrigida)
const normalizePhone = (phone) => {
  if (!phone) return '';
  
  let digitsOnly = phone.replace(/\D/g, '');
  
  // Remove prefixos comuns
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    digitsOnly = digitsOnly.substring(1);
  } else if ((digitsOnly.length === 13 || digitsOnly.length === 12) && digitsOnly.startsWith('55')) {
    digitsOnly = digitsOnly.substring(2);
  }
  
  // CORREÇÃO: O banco adiciona automaticamente o código 55 do Brasil
  if (digitsOnly.length === 10 || digitsOnly.length === 11) {
    return '55' + digitsOnly;
  }
  
  return digitsOnly;
};

async function testCurrentState() {
  console.log('🔍 Testando estado atual do sistema...');
  
  const testCompanyId = '21a30258-691c-4d13-bdb6-ac9bb86398ee';
  const testPhone = '(11) 98765-4321';
  const normalizedPhone = normalizePhone(testPhone);
  
  console.log(`📱 Telefone: "${testPhone}"`);
  console.log(`📱 Normalizado: "${normalizedPhone}"`);
  
  try {
    // 1. Limpar qualquer cliente existente com este telefone
    console.log('\n1. 🧹 Limpando clientes existentes...');
    
    // Buscar todos os possíveis formatos
    const possibleNormalized = [
      normalizedPhone,
      normalizedPhone.replace('55', ''), // sem 55
      '55' + normalizedPhone, // com 55 duplo
      testPhone.replace(/\D/g, '') // apenas dígitos
    ];
    
    for (const possible of possibleNormalized) {
      await supabase
        .from('clients')
        .delete()
        .eq('company_id', testCompanyId)
        .eq('normalized_phone', possible);
    }
    
    // Também deletar por telefone original
    await supabase
      .from('clients')
      .delete()
      .eq('company_id', testCompanyId)
      .eq('phone', testPhone);
    
    console.log('✅ Limpeza concluída');

    // 2. Verificar se realmente não há clientes
    console.log('\n2. 📋 Verificando se não há clientes...');
    const { data: existingClients } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', testCompanyId);
    
    console.log(`📊 Clientes existentes na empresa: ${existingClients.length}`);
    existingClients.forEach(client => {
      console.log(`   - ${client.name} | phone: "${client.phone}" | normalized: "${client.normalized_phone}"`);
    });

    // 3. Tentar criar primeiro cliente
    console.log('\n3. 📱 Criando primeiro cliente...');
    const { data: client1, error: error1 } = await supabase
      .from('clients')
      .insert({
        company_id: testCompanyId,
        name: 'Cliente Teste 1',
        phone: testPhone,
        email: 'teste1@email.com',
        normalized_phone: normalizedPhone
      })
      .select()
      .single();

    if (error1) {
      console.error('❌ Erro ao criar primeiro cliente:', error1);
      return;
    }

    console.log('✅ Primeiro cliente criado:');
    console.log(`   - ID: ${client1.id}`);
    console.log(`   - Nome: ${client1.name}`);
    console.log(`   - Phone: "${client1.phone}"`);
    console.log(`   - Normalized: "${client1.normalized_phone}"`);

    // 4. Aguardar um pouco e buscar o cliente
    console.log('\n4. 🔍 Buscando cliente criado...');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const { data: foundClients } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', testCompanyId)
      .eq('normalized_phone', client1.normalized_phone);

    console.log(`📊 Clientes encontrados: ${foundClients.length}`);
    foundClients.forEach(client => {
      console.log(`   - ${client.name} (${client.id})`);
    });

    // 5. Tentar criar segundo cliente com mesmo telefone
    console.log('\n5. 📱 Tentando criar segundo cliente (deve dar erro)...');
    const { data: client2, error: error2 } = await supabase
      .from('clients')
      .insert({
        company_id: testCompanyId,
        name: 'Cliente Teste 2',
        phone: testPhone,
        email: 'teste2@email.com',
        normalized_phone: normalizedPhone
      })
      .select()
      .single();

    if (error2) {
      console.log('✅ Erro esperado (constraint funcionando):', error2.message);
    } else {
      console.log('⚠️ Segundo cliente criado (constraint não está funcionando):', client2.name);
    }

    // Limpeza final
    console.log('\n6. 🧹 Limpeza final...');
    await supabase
      .from('clients')
      .delete()
      .eq('id', client1.id);
    
    console.log('✅ Teste concluído');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testCurrentState();