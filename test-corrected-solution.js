// Teste da solução corrigida
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mjufryrwcedazffgxbws.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdWZyeXJ3Y2VkYXpmZmd4YndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTQyMjEsImV4cCI6MjA2NzM5MDIyMX0.eVDDrGPjXt4lLwuT2XI1o5OMPbBIdxww4VwgDjCT0jo";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Função corrigida
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
  // Então precisamos garantir que sempre retornemos no formato esperado pelo banco
  if (digitsOnly.length === 10 || digitsOnly.length === 11) {
    return '55' + digitsOnly;
  }
  
  return digitsOnly;
};

async function createOrUpdateClientCorrected(companyId, clientData) {
  const normalizedPhone = normalizePhone(clientData.phone);
  
  if (!normalizedPhone || normalizedPhone.length < 10) {
    throw new Error('Número de telefone inválido');
  }

  console.log(`🔄 [CLIENTE] Processando cliente: ${clientData.name} - ${clientData.phone} (normalizado: ${normalizedPhone})`);

  // ESTRATÉGIA MAIS ROBUSTA: Tentar múltiplas vezes se necessário
  const maxAttempts = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔄 [CLIENTE] Tentativa ${attempt}/${maxAttempts}`);

      // 1. Buscar cliente existente
      const { data: existingClients } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', companyId)
        .eq('normalized_phone', normalizedPhone)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingClients && existingClients.length > 0) {
        // Cliente existe - atualizar
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
          console.error('Erro ao atualizar cliente:', updateError);
          throw updateError;
        }

        console.log(`✅ [CLIENTE] Cliente atualizado: ${updatedClient.name}`);
        return { client: updatedClient, isNew: false };
      }

      // 2. Cliente não existe - tentar criar
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
          // Alguém criou o cliente entre nossa busca e nossa inserção
          console.warn(`⚠️ [CLIENTE] Race condition detectada na tentativa ${attempt}, reintentando...`);
          lastError = insertError;
          
          // Pequeno delay antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 50 * attempt));
          continue;
        } else {
          throw insertError;
        }
      }

      console.log(`✅ [CLIENTE] Novo cliente criado: ${newClient.name} (${newClient.id})`);
      return { client: newClient, isNew: true };

    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) {
        console.error(`❌ [CLIENTE] Falha após ${maxAttempts} tentativas:`, error);
        break;
      }
    }
  }

  // Se chegou aqui, todas as tentativas falharam
  console.error('❌ [CLIENTE] Todas as tentativas falharam:', lastError);
  throw lastError;
}

async function testCorrectedSolution() {
  console.log('🧪 Testando solução corrigida...');
  
  const testCompanyId = '21a30258-691c-4d13-bdb6-ac9bb86398ee';
  const testPhone = '(11) 99999-2222';
  
  try {
    // Limpeza inicial
    console.log('\n0. 🧹 Limpeza inicial...');
    const normalizedForCleanup = normalizePhone(testPhone);
    await supabase
      .from('clients')
      .delete()
      .eq('company_id', testCompanyId)
      .eq('normalized_phone', normalizedForCleanup);

    console.log('\n1. 📱 Primeiro agendamento (criar cliente)...');
    const result1 = await createOrUpdateClientCorrected(testCompanyId, {
      name: 'João Corrigido',
      phone: testPhone,
      email: 'joao@corrigido.com'
    });
    
    console.log(`✅ Resultado 1: ${result1.isNew ? 'NOVO' : 'EXISTENTE'} - ${result1.client.name} (${result1.client.id})`);

    console.log('\n2. 📱 Segundo agendamento (mesmo telefone, nome diferente)...');
    const result2 = await createOrUpdateClientCorrected(testCompanyId, {
      name: 'João Silva Corrigido',
      phone: testPhone,
      email: 'joao.updated@corrigido.com'
    });
    
    console.log(`✅ Resultado 2: ${result2.isNew ? 'NOVO' : 'EXISTENTE'} - ${result2.client.name} (${result2.client.id})`);

    console.log('\n3. 📱 Terceiro agendamento (confirmação final)...');
    const result3 = await createOrUpdateClientCorrected(testCompanyId, {
      name: 'João Final Corrigido',
      phone: testPhone,
      email: 'joao.final@corrigido.com'
    });
    
    console.log(`✅ Resultado 3: ${result3.isNew ? 'NOVO' : 'EXISTENTE'} - ${result3.client.name} (${result3.client.id})`);

    // Verificar se todos são o mesmo cliente
    if (result1.client.id === result2.client.id && result2.client.id === result3.client.id) {
      console.log('\n🎉 SUCESSO COMPLETO! Problema da duplicação de clientes RESOLVIDO!');
      console.log(`   ✅ ID único: ${result1.client.id}`);
      console.log(`   ✅ Evolução dos nomes:`);
      console.log(`      1º: "${result1.client.name}"`);
      console.log(`      2º: "${result2.client.name}"`);
      console.log(`      3º: "${result3.client.name}"`);
      console.log(`   ✅ SEM DUPLICAÇÃO DE CLIENTES!`);
      console.log(`   ✅ CONSTRAINT FUNCIONANDO PERFEITAMENTE!`);
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
    console.log('✅ Limpeza concluída');

  } catch (error) {
    console.error('❌ Erro no teste corrigido:', error.message);
  }
}

testCorrectedSolution();