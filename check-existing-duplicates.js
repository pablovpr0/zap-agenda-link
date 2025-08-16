// Verificar duplicatas existentes
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

async function checkExistingDuplicates() {
  console.log('🔍 Verificando duplicatas existentes...');
  
  const testCompanyId = '21a30258-691c-4d13-bdb6-ac9bb86398ee';
  
  try {
    console.log('\n1. 📊 Buscando todos os clientes da empresa...');
    const { data: allClients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', testCompanyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      return;
    }

    console.log(`📋 Total de clientes: ${allClients.length}`);

    if (allClients.length === 0) {
      console.log('ℹ️ Nenhum cliente encontrado na empresa');
      return;
    }

    console.log('\n2. 📱 Analisando por telefone normalizado...');
    
    // Agrupar por telefone normalizado
    const phoneGroups = new Map();
    
    allClients.forEach(client => {
      const normalized = normalizePhone(client.phone);
      if (!phoneGroups.has(normalized)) {
        phoneGroups.set(normalized, []);
      }
      phoneGroups.get(normalized).push(client);
    });

    console.log(`📊 Grupos de telefone únicos: ${phoneGroups.size}`);

    // Identificar duplicatas
    const duplicateGroups = Array.from(phoneGroups.entries())
      .filter(([phone, clients]) => clients.length > 1);

    if (duplicateGroups.length === 0) {
      console.log('✅ Nenhuma duplicata encontrada por telefone normalizado');
    } else {
      console.log(`🔍 Encontrados ${duplicateGroups.length} grupos com duplicatas:`);
      
      duplicateGroups.forEach(([normalizedPhone, clients]) => {
        console.log(`\n📞 Telefone: ${normalizedPhone} (${clients.length} clientes)`);
        clients.forEach((client, index) => {
          console.log(`   ${index + 1}. ${client.name} - "${client.phone}" - normalized: "${client.normalized_phone}" (${client.id})`);
          console.log(`      Criado em: ${new Date(client.created_at).toLocaleString('pt-BR')}`);
        });
      });
    }

    console.log('\n3. 📱 Analisando por telefone original...');
    
    // Agrupar por telefone original (sem normalização)
    const originalPhoneGroups = new Map();
    
    allClients.forEach(client => {
      if (!originalPhoneGroups.has(client.phone)) {
        originalPhoneGroups.set(client.phone, []);
      }
      originalPhoneGroups.get(client.phone).push(client);
    });

    const originalDuplicateGroups = Array.from(originalPhoneGroups.entries())
      .filter(([phone, clients]) => clients.length > 1);

    if (originalDuplicateGroups.length === 0) {
      console.log('✅ Nenhuma duplicata encontrada por telefone original');
    } else {
      console.log(`🔍 Encontrados ${originalDuplicateGroups.length} grupos com duplicatas por telefone original:`);
      
      originalDuplicateGroups.forEach(([phone, clients]) => {
        console.log(`\n📞 Telefone original: "${phone}" (${clients.length} clientes)`);
        clients.forEach((client, index) => {
          console.log(`   ${index + 1}. ${client.name} (${client.id})`);
        });
      });
    }

    console.log('\n4. 📊 Resumo da análise:');
    console.log(`   - Total de clientes: ${allClients.length}`);
    console.log(`   - Telefones únicos (normalizado): ${phoneGroups.size}`);
    console.log(`   - Telefones únicos (original): ${originalPhoneGroups.size}`);
    console.log(`   - Grupos com duplicatas (normalizado): ${duplicateGroups.length}`);
    console.log(`   - Grupos com duplicatas (original): ${originalDuplicateGroups.length}`);

    if (duplicateGroups.length > 0 || originalDuplicateGroups.length > 0) {
      console.log('\n💡 RECOMENDAÇÃO: Execute o processo de consolidação de duplicatas');
    } else {
      console.log('\n✅ RESULTADO: Nenhuma duplicata detectada');
    }

  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  }
}

checkExistingDuplicates();