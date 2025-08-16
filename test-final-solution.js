// Teste da solução final usando INSERT com ON CONFLICT
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mjufryrwcedazffgxbws.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdWZyeXJ3Y2VkYXpmZmd4YndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTQyMjEsImV4cCI6MjA2NzM5MDIyMX0.eVDDrGPjXt4lLwuT2XI1o5OMPbBIdxww4VwgDjCT0jo";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Função para normalizar telefone
function normalizePhone(phone) {
  return phone.replace(/\D/g, '');
}

// Solução final usando raw SQL para garantir que funcione
async function createOrUpdateClientFinal(companyId, clientData) {
  const normalizedPhone = normalizePhone(clientData.phone);
  
  if (!normalizedPhone || normalizedPhone.length < 10) {
    throw new Error('Número de telefone inválido');
  }

  console.log(`🔄 [CLIENTE] Processando cliente: ${clientData.name} - ${clientData.phone} (normalizado: ${normalizedPhone})`);

  try {
    // Usar SQL direto para INSERT ... ON CONFLICT UPDATE
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO clients (company_id, name, phone, email, notes, normalized_phone, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (company_id, normalized_phone) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          notes = EXCLUDED.notes,
          updated_at = NOW()
        RETURNING *;
      `,
      params: [
        companyId,
        clientData.name,
        clientData.phone,
        clientData.email || null,
        clientData.notes || null,
        normalizedPhone
      ]
    });

    if (error) {
      console.error('❌ Erro no SQL:', error);
      throw error;
    }

    const client = data[0];
    console.log(`✅ [CLIENTE] Cliente processado: ${client.name} (${client.id})`);
    
    return { client, isNew: !client.updated_at || client.created_at === client.updated_at };

  } catch (error) {
    console.error('❌ Erro no SQL, tentando approach alternativo:', error.message);
    
    // Fallback: tentar usar .upsert() do Supabase
    try {
      const { data: client, error: upsertError } = await supabase
        .from('clients')
        .upsert({
          company_id: companyId,
          name: clientData.name,
          phone: clientData.phone,
          email: clientData.email || null,
          notes: clientData.notes || null,
          normalized_phone: normalizedPhone
        })
        .select()
        .single();

      if (upsertError) {
        throw upsertError;
      }

      console.log(`✅ [CLIENTE] Cliente processado via upsert: ${client.name} (${client.id})`);
      return { client, isNew: false }; // Assumimos que pode ser novo ou atualizado

    } catch (upsertError) {
      console.error('❌ Erro no upsert também:', upsertError.message);
      throw upsertError;
    }
  }
}

async function testFinalSolution() {
  console.log('🧪 Testando solução final...');
  
  const testCompanyId = '21a30258-691c-4d13-bdb6-ac9bb86398ee';
  const testPhone = '(11) 99999-6666';
  
  try {
    // Limpeza inicial
    console.log('\n0. 🧹 Limpeza inicial...');
    await supabase
      .from('clients')
      .delete()
      .eq('company_id', testCompanyId)
      .eq('normalized_phone', '11999996666');

    console.log('\n1. 📱 Primeiro agendamento (criar cliente)...');
    const result1 = await createOrUpdateClientFinal(testCompanyId, {
      name: 'João Final',
      phone: testPhone,
      email: 'joao@final.com'
    });
    
    console.log(`✅ Resultado 1: ${result1.isNew ? 'NOVO' : 'EXISTENTE'} - ${result1.client.name} (${result1.client.id})`);

    console.log('\n2. 📱 Segundo agendamento (mesmo telefone, nome diferente)...');
    const result2 = await createOrUpdateClientFinal(testCompanyId, {
      name: 'João Silva Final',
      phone: testPhone,
      email: 'joao.updated@final.com'
    });
    
    console.log(`✅ Resultado 2: ${result2.isNew ? 'NOVO' : 'EXISTENTE'} - ${result2.client.name} (${result2.client.id})`);

    // Verificar se é o mesmo cliente
    if (result1.client.id === result2.client.id) {
      console.log('🎉 SUCESSO! Mesmo cliente foi reutilizado/atualizado');
      console.log(`   - ID: ${result1.client.id}`);
      console.log(`   - Nome antes: "${result1.client.name}"`);
      console.log(`   - Nome depois: "${result2.client.name}"`);
    } else {
      console.log('⚠️  PROBLEMA: Cliente foi duplicado');
      console.log(`   - ID 1: ${result1.client.id}`);
      console.log(`   - ID 2: ${result2.client.id}`);
    }

    // Limpeza final
    console.log('\n3. 🧹 Limpeza final...');
    await supabase
      .from('clients')
      .delete()
      .eq('id', result2.client.id);
    console.log('✅ Limpeza concluída');

  } catch (error) {
    console.error('❌ Erro no teste final:', error.message);
  }
}

testFinalSolution();