// Verificar constraints da tabela clients
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mjufryrwcedazffgxbws.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdWZyeXJ3Y2VkYXpmZmd4YndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTQyMjEsImV4cCI6MjA2NzM5MDIyMX0.eVDDrGPjXt4lLwuT2XI1o5OMPbBIdxww4VwgDjCT0jo";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkConstraints() {
  console.log('🔍 Testando inserção para identificar constraint correta...');
  
  const testCompanyId = '21a30258-691c-4d13-bdb6-ac9bb86398ee';
  const testPhone = '(11) 99999-8888';
  const normalizedPhone = '11999998888';
  
  try {
    console.log('\n1. 📱 Tentando primeira inserção...');
    
    // Primeira inserção - deve funcionar
    const { data: client1, error: error1 } = await supabase
      .from('clients')
      .insert({
        company_id: testCompanyId,
        name: 'João Teste',
        phone: testPhone,
        email: 'joao@teste.com',
        normalized_phone: normalizedPhone
      })
      .select()
      .single();

    if (error1) {
      console.error('❌ Erro na primeira inserção:', error1.message);
    } else {
      console.log('✅ Primeira inserção OK:', client1.name, client1.id);
    }

    console.log('\n2. 📱 Tentando segunda inserção (deve dar erro de constraint)...');
    
    // Segunda inserção - deve dar erro de constraint
    const { data: client2, error: error2 } = await supabase
      .from('clients')
      .insert({
        company_id: testCompanyId,
        name: 'João Silva',
        phone: testPhone,
        email: 'joao2@teste.com',
        normalized_phone: normalizedPhone
      })
      .select()
      .single();

    if (error2) {
      console.error('📝 Erro esperado na segunda inserção:', error2.message);
      
      // Extrair nome da constraint
      if (error2.message.includes('constraint')) {
        const constraintMatch = error2.message.match(/"([^"]+)"/);
        if (constraintMatch) {
          console.log('🎯 Nome da constraint encontrado:', constraintMatch[1]);
        }
      }
    } else {
      console.log('⚠️ Segunda inserção funcionou (não deveria):', client2.name);
    }

    // Limpeza
    console.log('\n3. 🧹 Limpando dados de teste...');
    if (client1) {
      await supabase
        .from('clients')
        .delete()
        .eq('id', client1.id);
    }
    if (client2) {
      await supabase
        .from('clients')
        .delete()
        .eq('id', client2.id);
    }
    console.log('✅ Limpeza concluída');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

checkConstraints();