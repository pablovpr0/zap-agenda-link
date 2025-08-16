// Teste da implementação simplificada
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mjufryrwcedazffgxbws.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdWZyeXJ3Y2VkYXpmZmd4YndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTQyMjEsImV4cCI6MjA2NzM5MDIyMX0.eVDDrGPjXt4lLwuT2XI1o5OMPbBIdxww4VwgDjCT0jo";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Implementação simplificada
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

async function createOrUpdateClientSimplified(companyId, clientData) {
  const normalizedPhone = normalizePhone(clientData.phone);
  
  if (!normalizedPhone || normalizedPhone.length < 10) {
    throw new Error('Número de telefone inválido');
  }

  console.log(`🔄 [CLIENTE] Processando cliente: ${clientData.name} - ${clientData.phone} (normalizado: ${normalizedPhone})`);

  try {
    // SOLUÇÃO MAIS SIMPLES: Tentar inserir primeiro, depois buscar se der erro
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

    if (!insertError) {
      console.log(`✅ [CLIENTE] Novo cliente criado: ${newClient.name} (${newClient.id})`);
      return { client: newClient, isNew: true };
    }

    // Se deu erro de constraint única, significa que o cliente já existe
    if (insertError.message?.includes('idx_clients_company_normalized_phone_unique')) {
      console.log(`🔍 [CLIENTE] Cliente já existe, buscando para atualizar...`);
      
      // Aguardar um pouco para garantir consistência
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Buscar cliente existente com múltiplas estratégias
      let existingClient = null;
      
      // Estratégia 1: Por normalized_phone
      const { data: clientsByNormalized } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', companyId)
        .eq('normalized_phone', normalizedPhone)
        .limit(1);
      
      if (clientsByNormalized && clientsByNormalized.length > 0) {
        existingClient = clientsByNormalized[0];
      } else {
        // Estratégia 2: Por telefone original
        const { data: clientsByPhone } = await supabase
          .from('clients')
          .select('*')
          .eq('company_id', companyId)
          .eq('phone', clientData.phone)
          .limit(1);
        
        if (clientsByPhone && clientsByPhone.length > 0) {
          existingClient = clientsByPhone[0];
        }
      }

      if (!existingClient) {
        // Estratégia 3: Buscar todos e filtrar (última tentativa)
        const { data: allClients } = await supabase
          .from('clients')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (allClients && allClients.length > 0) {
          // Procurar por telefone similar
          existingClient = allClients.find(c => 
            c.normalized_phone === normalizedPhone ||
            c.phone === clientData.phone ||
            normalizePhone(c.phone) === normalizedPhone
          );
        }
      }

      if (existingClient) {
        console.log(`🔄 [CLIENTE] Cliente encontrado: ${existingClient.name} (${existingClient.id}), atualizando...`);
        
        // Atualizar cliente existente
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
          console.error('❌ [CLIENTE] Erro ao atualizar cliente:', updateError);
          // Se não conseguir atualizar, retorna o cliente original
          return { client: existingClient, isNew: false };
        }

        console.log(`✅ [CLIENTE] Cliente atualizado: ${updatedClient.name}`);
        return { client: updatedClient, isNew: false };
      }

      // Se ainda não encontrou o cliente, há algo errado
      console.error('❌ [CLIENTE] Cliente não encontrado após constraint violation');
      throw new Error('Cliente não encontrado após violação de constraint');
    }

    // Outro tipo de erro
    console.error('❌ [CLIENTE] Erro inesperado ao inserir:', insertError);
    throw insertError;

  } catch (error) {
    console.error('❌ [CLIENTE] Erro fatal:', error);
    throw error;
  }
}

async function testSimplifiedFix() {
  console.log('🚀 TESTE IMPLEMENTAÇÃO SIMPLIFICADA');
  
  const testCompanyId = '21a30258-691c-4d13-bdb6-ac9bb86398ee';
  const testPhone = '(11) 95555-4444';
  
  try {
    // Limpeza inicial
    console.log('\n0. 🧹 Limpeza inicial...');
    const normalizedForCleanup = normalizePhone(testPhone);
    await supabase
      .from('clients')
      .delete()
      .eq('company_id', testCompanyId)
      .eq('normalized_phone', normalizedForCleanup);

    console.log('\n1. 📱 PRIMEIRO AGENDAMENTO...');
    const result1 = await createOrUpdateClientSimplified(testCompanyId, {
      name: 'João Simplificado',
      phone: testPhone,
      email: 'simpl1@teste.com'
    });
    
    console.log(`✅ Resultado 1: ${result1.isNew ? 'NOVO' : 'EXISTENTE'} - ${result1.client.name} (${result1.client.id})`);

    console.log('\n2. 📱 SEGUNDO AGENDAMENTO...');
    const result2 = await createOrUpdateClientSimplified(testCompanyId, {
      name: 'João Silva Simplificado',
      phone: testPhone,
      email: 'simpl2@teste.com'
    });
    
    console.log(`✅ Resultado 2: ${result2.isNew ? 'NOVO' : 'EXISTENTE'} - ${result2.client.name} (${result2.client.id})`);

    console.log('\n3. 📱 TERCEIRO AGENDAMENTO...');
    const result3 = await createOrUpdateClientSimplified(testCompanyId, {
      name: 'João Santos Simplificado',
      phone: testPhone,
      email: 'simpl3@teste.com'
    });
    
    console.log(`✅ Resultado 3: ${result3.isNew ? 'NOVO' : 'EXISTENTE'} - ${result3.client.name} (${result3.client.id})`);

    // Verificação final
    if (result1.client.id === result2.client.id && result2.client.id === result3.client.id) {
      console.log('\n🎉 SUCESSO! IMPLEMENTAÇÃO SIMPLIFICADA FUNCIONOU!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ TODOS OS AGENDAMENTOS USARAM O MESMO CLIENTE');
      console.log(`✅ ID ÚNICO: ${result1.client.id}`);
      console.log(`✅ NOME FINAL: "${result3.client.name}"`);
      console.log('✅ ERRO 409 DEVE ESTAR RESOLVIDO AGORA!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('\n❌ PROBLEMA: Clientes foram duplicados');
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
    console.error('❌ ERRO NO TESTE:', error.message);
  }
}

testSimplifiedFix();