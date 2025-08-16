// Teste da nova implementação
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mjufryrwcedazffgxbws.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdWZyeXJ3Y2VkYXpmZmd4YndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTQyMjEsImV4cCI6MjA2NzM5MDIyMX0.eVDDrGPjXt4lLwuT2XI1o5OMPbBIdxww4VwgDjCT0jo";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Simular a nova implementação
const normalizePhone = (phone) => {
  if (!phone) return '';
  
  let digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    digitsOnly = digitsOnly.substring(1);
  } else if ((digitsOnly.length === 13 || digitsOnly.length === 12) && digitsOnly.startsWith('55')) {
    digitsOnly = digitsOnly.substring(2);
  }
  
  if (digitsOnly.length === 10 || digitsOnly.length === 11) {
    return '55' + digitsOnly;
  }
  
  return digitsOnly;
};

async function createOrUpdateClientTest(companyId, clientData) {
  const normalizedPhone = normalizePhone(clientData.phone);
  
  if (!normalizedPhone || normalizedPhone.length < 10) {
    throw new Error('Número de telefone inválido');
  }

  console.log(`🔄 [CLIENTE] Processando cliente: ${clientData.name} - ${clientData.phone} (normalizado: ${normalizedPhone})`);

  try {
    const clientPayload = {
      company_id: companyId,
      name: clientData.name,
      phone: clientData.phone,
      email: clientData.email || null,
      notes: clientData.notes || null,
      normalized_phone: normalizedPhone
    };

    console.log(`🔄 [CLIENTE] Tentando upsert...`);

    const { data: upsertedClient, error: upsertError } = await supabase
      .from('clients')
      .upsert(clientPayload, {
        onConflict: 'company_id,normalized_phone',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (upsertError) {
      console.error('❌ [CLIENTE] Erro no upsert direto:', upsertError.message);
      
      // Método manual de buscar primeiro
      console.log('🔍 [CLIENTE] Tentando buscar cliente existente...');
      const { data: existingClients } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', companyId)
        .eq('normalized_phone', normalizedPhone)
        .limit(1);

      if (existingClients && existingClients.length > 0) {
        // Cliente existe, atualizar
        const existingClient = existingClients[0];
        console.log(`🔄 [CLIENTE] Cliente existente encontrado, atualizando: ${existingClient.name}`);

        const { data: updatedClient, error: updateError } = await supabase
          .from('clients')
          .update({
            name: clientData.name,
            phone: clientData.phone,
            email: clientData.email || null,
            notes: clientData.notes || null
          })
          .eq('id', existingClient.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ [CLIENTE] Erro ao atualizar cliente existente:', updateError);
          throw updateError;
        }

        console.log(`✅ [CLIENTE] Cliente atualizado: ${updatedClient.name}`);
        return { client: updatedClient, isNew: false };
      } else {
        // Cliente não existe, tentar criar
        console.log(`🆕 [CLIENTE] Cliente não existe, criando novo: ${clientData.name}`);

        const { data: newClient, error: insertError } = await supabase
          .from('clients')
          .insert(clientPayload)
          .select()
          .single();

        if (insertError) {
          if (insertError.message?.includes('idx_clients_company_normalized_phone_unique')) {
            // Race condition - cliente foi criado entre nossa busca e inserção
            console.warn('⚠️ [CLIENTE] Race condition detectada, buscando cliente criado...');
            
            // Aguardar um pouco e buscar novamente
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const { data: raceClient } = await supabase
              .from('clients')
              .select('*')
              .eq('company_id', companyId)
              .eq('normalized_phone', normalizedPhone)
              .single();

            if (raceClient) {
              console.log(`✅ [CLIENTE] Cliente encontrado após race condition: ${raceClient.name}`);
              return { client: raceClient, isNew: false };
            }
          }
          
          console.error('❌ [CLIENTE] Erro ao inserir novo cliente:', insertError);
          throw insertError;
        }

        console.log(`✅ [CLIENTE] Novo cliente criado: ${newClient.name}`);
        return { client: newClient, isNew: true };
      }
    }

    console.log(`✅ [CLIENTE] Cliente processado via upsert: ${upsertedClient.name}`);
    return { client: upsertedClient, isNew: false };

  } catch (error) {
    console.error('❌ [CLIENTE] Erro fatal no processamento:', error);
    throw error;
  }
}

async function testNewImplementation() {
  console.log('🧪 Testando nova implementação...');
  
  const testCompanyId = '21a30258-691c-4d13-bdb6-ac9bb86398ee';
  const testPhone = '(11) 91234-5678';
  
  try {
    // Limpeza inicial
    console.log('\n0. 🧹 Limpeza inicial...');
    const normalizedForCleanup = normalizePhone(testPhone);
    await supabase
      .from('clients')
      .delete()
      .eq('company_id', testCompanyId)
      .eq('normalized_phone', normalizedForCleanup);

    console.log('\n1. 📱 Primeiro agendamento...');
    const result1 = await createOrUpdateClientTest(testCompanyId, {
      name: 'Cliente Implementação 1',
      phone: testPhone,
      email: 'impl1@teste.com'
    });
    
    console.log(`✅ Resultado 1: ${result1.isNew ? 'NOVO' : 'EXISTENTE'} - ${result1.client.name} (${result1.client.id})`);

    console.log('\n2. 📱 Segundo agendamento (mesmo telefone)...');
    const result2 = await createOrUpdateClientTest(testCompanyId, {
      name: 'Cliente Implementação 2',
      phone: testPhone,
      email: 'impl2@teste.com'
    });
    
    console.log(`✅ Resultado 2: ${result2.isNew ? 'NOVO' : 'EXISTENTE'} - ${result2.client.name} (${result2.client.id})`);

    console.log('\n3. 📱 Terceiro agendamento (confirmação)...');
    const result3 = await createOrUpdateClientTest(testCompanyId, {
      name: 'Cliente Implementação 3',
      phone: testPhone,
      email: 'impl3@teste.com'
    });
    
    console.log(`✅ Resultado 3: ${result3.isNew ? 'NOVO' : 'EXISTENTE'} - ${result3.client.name} (${result3.client.id})`);

    // Verificar se todos são o mesmo cliente
    if (result1.client.id === result2.client.id && result2.client.id === result3.client.id) {
      console.log('\n🎉 SUCESSO! Todos os agendamentos usaram o mesmo cliente');
      console.log(`   ✅ ID único: ${result1.client.id}`);
      console.log(`   ✅ Nome final: "${result3.client.name}"`);
      console.log(`   ✅ Erro 409 deve estar RESOLVIDO!`);
    } else {
      console.log('\n⚠️ PROBLEMA: Clientes foram duplicados');
      console.log(`   - ID 1: ${result1.client.id}`);
      console.log(`   - ID 2: ${result2.client.id}`);
      console.log(`   - ID 3: ${result3.client.id}`);
    }

    // Limpeza final
    console.log('\n4. 🧹 Limpeza final...');
    await supabase
      .from('clients')
      .delete()
      .eq('id', result3.client.id);
    console.log('✅ Teste concluído');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testNewImplementation();