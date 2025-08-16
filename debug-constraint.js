// Debug da constraint única
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mjufryrwcedazffgxbws.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdWZyeXJ3Y2VkYXpmZmd4YndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTQyMjEsImV4cCI6MjA2NzM5MDIyMX0.eVDDrGPjXt4lLwuT2XI1o5OMPbBIdxww4VwgDjCT0jo";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugConstraint() {
  console.log('🔍 Debug da constraint única...');
  
  const testCompanyId = '21a30258-691c-4d13-bdb6-ac9bb86398ee';
  const testPhone = '(11) 99999-7777'; // Telefone diferente para evitar conflito
  const normalizedPhone = '11999997777';
  
  try {
    console.log('\n1. 🧹 Limpando qualquer cliente existente...');
    await supabase
      .from('clients')
      .delete()
      .eq('company_id', testCompanyId)
      .eq('normalized_phone', normalizedPhone);
    
    console.log('✅ Limpeza concluída');

    console.log('\n2. 📋 Verificando se não há nenhum cliente...');
    const { data: existingClients } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', testCompanyId)
      .eq('normalized_phone', normalizedPhone);
    
    console.log(`📊 Clientes encontrados: ${existingClients.length}`);

    console.log('\n3. 📱 Tentando inserir primeiro cliente...');
    const { data: client1, error: error1 } = await supabase
      .from('clients')
      .insert({
        company_id: testCompanyId,
        name: 'João Debug 1',
        phone: testPhone,
        email: 'debug1@teste.com',
        normalized_phone: normalizedPhone
      })
      .select()
      .single();

    if (error1) {
      console.error('❌ Erro na primeira inserção:', error1.message);
      return;
    }

    console.log('✅ Primeira inserção OK:', client1.name, client1.id);

    console.log('\n4. 📱 Tentando inserir segundo cliente (deve dar erro)...');
    const { data: client2, error: error2 } = await supabase
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

    if (error2) {
      console.error('✅ Erro esperado na segunda inserção:', error2.message);
    } else {
      console.log('⚠️ Segunda inserção funcionou (não deveria):', client2.name);
    }

    console.log('\n5. 📋 Verificando quantos clientes existem agora...');
    const { data: finalClients } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', testCompanyId)
      .eq('normalized_phone', normalizedPhone);
    
    console.log(`📊 Total de clientes: ${finalClients.length}`);
    finalClients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.name} (${client.id})`);
    });

    // Limpeza final
    console.log('\n6. 🧹 Limpeza final...');
    await supabase
      .from('clients')
      .delete()
      .eq('company_id', testCompanyId)
      .eq('normalized_phone', normalizedPhone);
    
    console.log('✅ Limpeza final concluída');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debugConstraint();