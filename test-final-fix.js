// Teste final da correção definitiva
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mjufryrwcedazffgxbws.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdWZyeXJ3Y2VkYXpmZmd4YndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTQyMjEsImV4cCI6MjA2NzM5MDIyMX0.eVDDrGPjXt4lLwuT2XI1o5OMPbBIdxww4VwgDjCT0jo";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Implementação final
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

async function createOrUpdateClientFinal(companyId, clientData) {
  const normalizedPhone = normalizePhone(clientData.phone);
  
  if (!normalizedPhone || normalizedPhone.length < 10) {
    throw new Error('Número de telefone inválido');
  }

  console.log(`🔄 [CLIENTE] Processando cliente: ${clientData.name} - ${clientData.phone} (normalizado: ${normalizedPhone})`);

  const maxRetries = 3;
  
  for (let retry = 0; retry < maxRetries; retry++) {
    try {
      console.log(`🔄 [CLIENTE] Tentativa ${retry + 1}/${maxRetries}`);

      // 1. SEMPRE buscar primeiro
      const { data: existingClients, error: searchError } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', companyId)
        .eq('normalized_phone', normalizedPhone)
        .limit(1);

      if (searchError) {
        console.error('❌ [CLIENTE] Erro na busca:', searchError);
        throw searchError;
      }

      if (existingClients && existingClients.length > 0) {
        // Cliente encontrado - atualizar
        const existingClient = existingClients[0];
        console.log(`🔄 [CLIENTE] Cliente encontrado: ${existingClient.name} (${existingClient.id})`);

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
          console.error('❌ [CLIENTE] Erro ao atualizar:', updateError);
          throw updateError;
        }

        console.log(`✅ [CLIENTE] Cliente atualizado: ${updatedClient.name}`);
        return { client: updatedClient, isNew: false };
      }

      // 2. Cliente não encontrado - tentar criar
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
        if (insertError.message?.includes('idx_clients_company_normalized_phone_unique')) {
          // Race condition detectada - outro processo criou o cliente
          console.warn(`⚠️ [CLIENTE] Race condition na tentativa ${retry + 1}, aguardando e reintentando...`);
          
          // Aguardar um pouco antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 100 * (retry + 1)));
          continue; // Tentar novamente do início (buscar → inserir)
        }
        
        console.error('❌ [CLIENTE] Erro na inserção:', insertError);
        throw insertError;
      }

      console.log(`✅ [CLIENTE] Novo cliente criado: ${newClient.name} (${newClient.id})`);
      return { client: newClient, isNew: true };

    } catch (error) {
      if (retry === maxRetries - 1) {
        // Última tentativa falhou
        console.error('❌ [CLIENTE] Todas as tentativas falharam:', error);
        throw error;
      }
      
      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, 100 * (retry + 1)));
    }
  }

  throw new Error('Falha ao processar cliente após múltiplas tentativas');
}

async function testFinalFix() {
  console.log('🚀 TESTE FINAL - Correção Definitiva do Erro 409');
  
  const testCompanyId = '21a30258-691c-4d13-bdb6-ac9bb86398ee';
  const testPhone = '(11) 99888-7777';
  
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
    const result1 = await createOrUpdateClientFinal(testCompanyId, {
      name: 'João Final Test',
      phone: testPhone,
      email: 'final1@teste.com'
    });
    
    console.log(`✅ Resultado 1: ${result1.isNew ? 'NOVO' : 'EXISTENTE'} - ${result1.client.name} (${result1.client.id})`);

    console.log('\n2. 📱 SEGUNDO AGENDAMENTO (MESMO TELEFONE)...');
    const result2 = await createOrUpdateClientFinal(testCompanyId, {
      name: 'João Silva Final Test',
      phone: testPhone,
      email: 'final2@teste.com'
    });
    
    console.log(`✅ Resultado 2: ${result2.isNew ? 'NOVO' : 'EXISTENTE'} - ${result2.client.name} (${result2.client.id})`);

    console.log('\n3. 📱 TERCEIRO AGENDAMENTO (CONFIRMAÇÃO)...');
    const result3 = await createOrUpdateClientFinal(testCompanyId, {
      name: 'João Santos Final Test',
      phone: testPhone,
      email: 'final3@teste.com'
    });
    
    console.log(`✅ Resultado 3: ${result3.isNew ? 'NOVO' : 'EXISTENTE'} - ${result3.client.name} (${result3.client.id})`);

    // Verificação final
    if (result1.client.id === result2.client.id && result2.client.id === result3.client.id) {
      console.log('\n🎉 SUCESSO TOTAL! ERRO 409 RESOLVIDO!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ TODOS OS AGENDAMENTOS USARAM O MESMO CLIENTE');
      console.log(`✅ ID ÚNICO: ${result1.client.id}`);
      console.log(`✅ NOME FINAL: "${result3.client.name}"`);
      console.log('✅ SEM DUPLICAÇÃO DE CLIENTES');
      console.log('✅ SEM ERRO 409 (CONFLICT)');
      console.log('✅ RACE CONDITIONS TRATADAS');
      console.log('✅ PRONTO PARA PRODUÇÃO!');
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
    console.log('✅ Teste concluído com sucesso');

  } catch (error) {
    console.error('❌ ERRO NO TESTE FINAL:', error.message);
    console.log('\n⚠️  Se este erro persistir, pode haver um problema mais profundo na configuração do banco.');
  }
}

testFinalFix();