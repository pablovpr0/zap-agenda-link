// Teste rápido para verificar se a correção de clientes funcionou
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mjufryrwcedazffgxbws.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdWZyeXJ3Y2VkYXpmZmd4YndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTQyMjEsImV4cCI6MjA2NzM5MDIyMX0.eVDDrGPjXt4lLwuT2XI1o5OMPbBIdxww4VwgDjCT0jo";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testClientUpsert() {
  console.log('🧪 Testando UPSERT de clientes...');
  
  const testCompanyId = '21a30258-691c-4d13-bdb6-ac9bb86398ee'; // ID da empresa de teste
  const testPhone = '(11) 99999-8888';
  const normalizedPhone = '11999998888';
  
  try {
    console.log('\n1. 📱 Tentando primeiro UPSERT...');
    
    // Primeiro UPSERT - deve criar cliente
    const { data: client1, error: error1 } = await supabase
      .from('clients')
      .upsert({
        company_id: testCompanyId,
        name: 'João Teste',
        phone: testPhone,
        email: 'joao@teste.com',
        normalized_phone: normalizedPhone
      }, {
        onConflict: 'company_id,normalized_phone',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error1) {
      console.error('❌ Erro no primeiro UPSERT:', error1.message);
      return;
    }

    console.log('✅ Primeiro UPSERT OK:', client1.name, client1.id);

    console.log('\n2. 📱 Tentando segundo UPSERT (deve atualizar)...');
    
    // Segundo UPSERT - deve atualizar cliente existente
    const { data: client2, error: error2 } = await supabase
      .from('clients')
      .upsert({
        company_id: testCompanyId,
        name: 'João Silva Updated',
        phone: testPhone,
        email: 'joao.updated@teste.com',
        normalized_phone: normalizedPhone
      }, {
        onConflict: 'company_id,normalized_phone',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error2) {
      console.error('❌ Erro no segundo UPSERT:', error2.message);
      return;
    }

    console.log('✅ Segundo UPSERT OK:', client2.name, client2.id);

    // Verificar se é o mesmo cliente (mesmo ID)
    if (client1.id === client2.id) {
      console.log('🎉 SUCESSO! Mesmo cliente foi atualizado, não duplicado');
      console.log(`   - ID: ${client1.id}`);
      console.log(`   - Nome antes: "${client1.name}"`);
      console.log(`   - Nome depois: "${client2.name}"`);
    } else {
      console.log('⚠️  PROBLEMA: Cliente foi duplicado');
      console.log(`   - ID 1: ${client1.id}`);
      console.log(`   - ID 2: ${client2.id}`);
    }

    // Limpeza - deletar cliente de teste
    console.log('\n3. 🧹 Limpando dados de teste...');
    await supabase
      .from('clients')
      .delete()
      .eq('id', client2.id);
    
    console.log('✅ Dados de teste removidos');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testClientUpsert();