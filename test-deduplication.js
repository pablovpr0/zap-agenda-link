// Teste do serviço de desduplicação
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mjufryrwcedazffgxbws.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdWZyeXJ3Y2VkYXpmZmd4YndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTQyMjEsImV4cCI6MjA2NzM5MDIyMX0.eVDDrGPjXt4lLwuT2XI1o5OMPbBIdxww4VwgDjCT0jo";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

async function testDeduplication() {
  console.log('🧪 Testando serviço de desduplicação...');
  
  const testCompanyId = '21a30258-691c-4d13-bdb6-ac9bb86398ee';
  const testPhone = '(11) 94444-5555';
  const normalizedPhone = normalizePhone(testPhone);
  
  try {
    console.log('\n1. 🧹 Limpeza inicial...');
    await supabase
      .from('clients')
      .delete()
      .eq('company_id', testCompanyId)
      .eq('normalized_phone', normalizedPhone);

    console.log('\n2. 📱 Criando clientes duplicados manualmente...');
    
    // Criar 3 clientes com mesmo telefone mas dados ligeiramente diferentes
    const duplicateClients = [
      {
        company_id: testCompanyId,
        name: 'Maria Silva',
        phone: testPhone,
        email: 'maria@email.com',
        normalized_phone: normalizedPhone
      },
      {
        company_id: testCompanyId,
        name: 'Maria Silva Santos',
        phone: testPhone,
        email: 'maria.santos@email.com',
        normalized_phone: normalizedPhone
      },
      {
        company_id: testCompanyId,
        name: 'Maria S. Santos',
        phone: testPhone,
        notes: 'Cliente VIP',
        normalized_phone: normalizedPhone
      }
    ];

    for (let i = 0; i < duplicateClients.length; i++) {
      const { data: client, error } = await supabase
        .from('clients')
        .insert(duplicateClients[i])
        .select()
        .single();

      if (error) {
        console.error(`❌ Erro ao criar cliente ${i + 1}:`, error.message);
      } else {
        console.log(`✅ Cliente ${i + 1} criado: ${client.name} (${client.id})`);
      }
    }

    console.log('\n3. 📊 Verificando clientes antes da desduplicação...');
    const { data: beforeClients } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', testCompanyId)
      .eq('normalized_phone', normalizedPhone);

    console.log(`📋 Clientes encontrados: ${beforeClients.length}`);
    beforeClients.forEach((client, index) => {
      console.log(`   ${index + 1}. ${client.name} - ${client.email || 'sem email'} - ${client.notes || 'sem notas'} (${client.id})`);
    });

    console.log('\n4. 🔧 Executando desduplicação...');
    
    // Simular o processo de desduplicação
    if (beforeClients.length > 1) {
      const sortedClients = beforeClients.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const primaryClient = sortedClients[0];
      const duplicatesToRemove = sortedClients.slice(1);

      console.log(`👤 Cliente principal: ${primaryClient.name} (${primaryClient.id})`);
      console.log(`🗑️ Removendo ${duplicatesToRemove.length} duplicatas`);

      // Consolidar dados
      const consolidatedData = {
        name: primaryClient.name,
        email: primaryClient.email,
        notes: primaryClient.notes
      };

      // Pegar informações mais completas das duplicatas
      for (const duplicate of duplicatesToRemove) {
        if (!consolidatedData.email && duplicate.email) {
          consolidatedData.email = duplicate.email;
        }
        if (!consolidatedData.notes && duplicate.notes) {
          consolidatedData.notes = duplicate.notes;
        }
        if (duplicate.name.length > consolidatedData.name.length) {
          consolidatedData.name = duplicate.name;
        }
      }

      // Atualizar cliente principal
      const { error: updateError } = await supabase
        .from('clients')
        .update(consolidatedData)
        .eq('id', primaryClient.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar cliente principal:', updateError);
      } else {
        console.log('✅ Cliente principal atualizado com dados consolidados');
      }

      // Remover duplicatas
      for (const duplicate of duplicatesToRemove) {
        const { error: deleteError } = await supabase
          .from('clients')
          .delete()
          .eq('id', duplicate.id);

        if (deleteError) {
          console.error(`❌ Erro ao deletar ${duplicate.name}:`, deleteError);
        } else {
          console.log(`🗑️ Duplicata removida: ${duplicate.name}`);
        }
      }
    }

    console.log('\n5. 📊 Verificando resultado após desduplicação...');
    const { data: afterClients } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', testCompanyId)
      .eq('normalized_phone', normalizedPhone);

    console.log(`📋 Clientes após desduplicação: ${afterClients.length}`);
    afterClients.forEach((client, index) => {
      console.log(`   ${index + 1}. ${client.name} - ${client.email || 'sem email'} - ${client.notes || 'sem notas'} (${client.id})`);
    });

    if (afterClients.length === 1) {
      console.log('\n🎉 SUCESSO! Desduplicação funcionou corretamente!');
      console.log(`✅ 1 cliente único mantido: ${afterClients[0].name}`);
      console.log(`✅ Dados consolidados: email=${afterClients[0].email}, notas=${afterClients[0].notes}`);
    } else {
      console.log('\n⚠️ PROBLEMA: Ainda há duplicatas ou nenhum cliente restou');
    }

    // Limpeza final
    console.log('\n6. 🧹 Limpeza final...');
    await supabase
      .from('clients')
      .delete()
      .eq('company_id', testCompanyId)
      .eq('normalized_phone', normalizedPhone);
    console.log('✅ Teste concluído');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testDeduplication();