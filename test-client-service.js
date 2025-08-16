// Teste da nova implementação do clientService
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mjufryrwcedazffgxbws.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdWZyeXJ3Y2VkYXpmZmd4YndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTQyMjEsImV4cCI6MjA2NzM5MDIyMX0.eVDDrGPjXt4lLwuT2XI1o5OMPbBIdxww4VwgDjCT0jo";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Função para normalizar telefone (simplificada)
function normalizePhone(phone) {
  return phone.replace(/\D/g, '');
}

// Implementação simplificada da lógica do clientService
async function createOrUpdateClient(companyId, clientData) {
  const normalizedPhone = normalizePhone(clientData.phone);
  
  if (!normalizedPhone || normalizedPhone.length < 10) {
    throw new Error('Número de telefone inválido');
  }

  console.log(`🔄 [CLIENTE] Processando cliente: ${clientData.name} - ${clientData.phone} (normalizado: ${normalizedPhone})`);

  // ESTRATÉGIA: Buscar primeiro, depois inserir/atualizar conforme necessário
  const { data: existingClients } = await supabase
    .from('clients')
    .select('*')
    .eq('company_id', companyId)
    .eq('normalized_phone', normalizedPhone)
    .order('created_at', { ascending: false })
    .limit(1);

  let client;
  let isNew;

  if (existingClients && existingClients.length > 0) {
    // Cliente existe - atualizar dados
    const existingClient = existingClients[0];
    console.log(`🔄 [CLIENTE] Cliente existente encontrado: ${existingClient.name} (${existingClient.id})`);

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
      console.error('Erro ao atualizar cliente:', updateError);
      throw updateError;
    }

    client = updatedClient;
    isNew = false;
    console.log(`✅ [CLIENTE] Cliente atualizado: ${client.name} (dados atualizados)`);

  } else {
    // Cliente não existe - criar novo
    console.log(`🆕 [CLIENTE] Criando novo cliente: ${clientData.name}`);

    const { data: newClient, error: insertError } = await supabase
      .from('clients')
      .insert({
        company_id: companyId,
        name: clientData.name,
        phone: clientData.phone,
        email: clientData.email || null,
        notes: clientData.notes || null,
        normalized_phone: normalizedPhone
      })
      .select()
      .single();

    if (insertError) {
      // Se der erro de constraint, significa que outro processo criou o cliente simultaneamente
      if (insertError.message?.includes('idx_clients_company_normalized_phone_unique')) {
        console.warn('⚠️ [CLIENTE] Cliente criado simultaneamente por outro processo, buscando...');
        
        // Buscar o cliente que foi criado (sem .single() para evitar erro se não encontrar)
        const { data: foundClients, error: findError } = await supabase
          .from('clients')
          .select('*')
          .eq('company_id', companyId)
          .eq('normalized_phone', normalizedPhone)
          .order('created_at', { ascending: false })
          .limit(1);

        if (findError || !foundClients || foundClients.length === 0) {
          console.error('Erro ao buscar cliente criado simultaneamente:', findError);
          throw insertError;
        }

        const foundClient = foundClients[0];

        client = foundClient;
        isNew = false;
        console.log(`✅ [CLIENTE] Cliente encontrado após criação simultânea: ${client.name}`);
      } else {
        console.error('Erro ao criar cliente:', insertError);
        throw insertError;
      }
    } else {
      client = newClient;
      isNew = true;
      console.log(`✅ [CLIENTE] Novo cliente criado: ${client.name} (${client.phone})`);
    }
  }

  return { client, isNew };
}

async function testClientService() {
  console.log('🧪 Testando nova lógica de clientes...');
  
  const testCompanyId = '21a30258-691c-4d13-bdb6-ac9bb86398ee';
  const testPhone = '(11) 99999-7777';
  
  try {
    console.log('\n1. 📱 Primeiro agendamento (criar cliente)...');
    
    const result1 = await createOrUpdateClient(testCompanyId, {
      name: 'João Teste',
      phone: testPhone,
      email: 'joao@teste.com'
    });
    
    console.log(`✅ Resultado 1: ${result1.isNew ? 'NOVO' : 'EXISTENTE'} - ${result1.client.name} (${result1.client.id})`);

    console.log('\n2. 📱 Segundo agendamento (mesmo telefone, nome diferente)...');
    
    const result2 = await createOrUpdateClient(testCompanyId, {
      name: 'João Silva Santos',
      phone: testPhone,
      email: 'joao.updated@teste.com'
    });
    
    console.log(`✅ Resultado 2: ${result2.isNew ? 'NOVO' : 'EXISTENTE'} - ${result2.client.name} (${result2.client.id})`);

    // Verificar se é o mesmo cliente
    if (result1.client.id === result2.client.id) {
      console.log('🎉 SUCESSO! Mesmo cliente foi reutilizado, não duplicado');
      console.log(`   - ID: ${result1.client.id}`);
      console.log(`   - Nome antes: "${result1.client.name}"`);
      console.log(`   - Nome depois: "${result2.client.name}"`);
    } else {
      console.log('⚠️  PROBLEMA: Cliente foi duplicado');
      console.log(`   - ID 1: ${result1.client.id}`);
      console.log(`   - ID 2: ${result2.client.id}`);
    }

    console.log('\n3. 📱 Terceiro agendamento (confirmar reutilização)...');
    
    const result3 = await createOrUpdateClient(testCompanyId, {
      name: 'João Silva Santos Updated',
      phone: testPhone,
      email: 'joao.final@teste.com'
    });
    
    console.log(`✅ Resultado 3: ${result3.isNew ? 'NOVO' : 'EXISTENTE'} - ${result3.client.name} (${result3.client.id})`);

    // Limpeza
    console.log('\n4. 🧹 Limpando dados de teste...');
    await supabase
      .from('clients')
      .delete()
      .eq('id', result3.client.id);
    
    console.log('✅ Dados de teste removidos');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testClientService();