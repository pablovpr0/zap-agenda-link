import { supabase } from '@/integrations/supabase/client';
import { normalizePhone, arePhoneNumbersEqual } from '@/utils/phoneNormalization';
import { devLog, devError, devWarn } from '@/utils/console';

interface ClientForDeduplication {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  created_at: string;
  normalized_phone?: string;
  company_id: string;
}

/**
 * Detecta e consolida clientes duplicados por telefone
 */
export const deduplicateClients = async (companyId: string): Promise<{
  duplicatesFound: number;
  duplicatesRemoved: number;
  clientsConsolidated: number;
}> => {
  devLog(`🔍 [DEDUPLICAÇÃO] Iniciando processo para empresa ${companyId}`);
  
  try {
    // 1. Buscar todos os clientes da empresa
    const { data: allClients, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true }); // Mais antigo primeiro

    if (fetchError) {
      devError('❌ [DEDUPLICAÇÃO] Erro ao buscar clientes:', fetchError);
      throw fetchError;
    }

    if (!allClients || allClients.length === 0) {
      devLog('ℹ️ [DEDUPLICAÇÃO] Nenhum cliente encontrado');
      return { duplicatesFound: 0, duplicatesRemoved: 0, clientsConsolidated: 0 };
    }

    devLog(`📊 [DEDUPLICAÇÃO] Analisando ${allClients.length} clientes`);

    // 2. Agrupar clientes por telefone normalizado
    const clientGroups = new Map<string, ClientForDeduplication[]>();
    
    for (const client of allClients) {
      const normalizedPhone = normalizePhone(client.phone);
      
      if (!normalizedPhone) {
        devWarn(`⚠️ [DEDUPLICAÇÃO] Cliente ${client.name} tem telefone inválido: ${client.phone}`);
        continue;
      }

      if (!clientGroups.has(normalizedPhone)) {
        clientGroups.set(normalizedPhone, []);
      }
      clientGroups.get(normalizedPhone)!.push(client);
    }

    // 3. Identificar grupos com duplicatas
    const duplicateGroups = Array.from(clientGroups.entries())
      .filter(([phone, clients]) => clients.length > 1);

    if (duplicateGroups.length === 0) {
      devLog('✅ [DEDUPLICAÇÃO] Nenhuma duplicata encontrada');
      return { duplicatesFound: 0, duplicatesRemoved: 0, clientsConsolidated: 0 };
    }

    devLog(`🔍 [DEDUPLICAÇÃO] Encontrados ${duplicateGroups.length} grupos de duplicatas`);

    let totalDuplicatesFound = 0;
    let totalDuplicatesRemoved = 0;
    let totalClientsConsolidated = 0;

    // 4. Consolidar cada grupo de duplicatas
    for (const [normalizedPhone, duplicateClients] of duplicateGroups) {
      totalDuplicatesFound += duplicateClients.length;
      
      devLog(`📞 [DEDUPLICAÇÃO] Consolidando ${duplicateClients.length} clientes com telefone ${normalizedPhone}`);
      
      // Ordenar por data de criação (mais antigo primeiro)
      const sortedClients = duplicateClients.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const primaryClient = sortedClients[0]; // Manter o mais antigo
      const duplicatesToRemove = sortedClients.slice(1); // Remover os outros

      devLog(`👤 [DEDUPLICAÇÃO] Cliente principal: ${primaryClient.name} (${primaryClient.id})`);
      devLog(`🗑️ [DEDUPLICAÇÃO] Removendo ${duplicatesToRemove.length} duplicatas`);

      // 5. Atualizar agendamentos dos clientes duplicados para apontar para o principal
      for (const duplicateClient of duplicatesToRemove) {
        try {
          const { error: updateAppointmentsError } = await supabase
            .from('appointments')
            .update({ client_id: primaryClient.id })
            .eq('client_id', duplicateClient.id);

          if (updateAppointmentsError) {
            devError(`❌ [DEDUPLICAÇÃO] Erro ao transferir agendamentos de ${duplicateClient.name}:`, updateAppointmentsError);
          } else {
            devLog(`📅 [DEDUPLICAÇÃO] Agendamentos transferidos de ${duplicateClient.name} para ${primaryClient.name}`);
          }
        } catch (transferError) {
          devError(`❌ [DEDUPLICAÇÃO] Erro na transferência de agendamentos:`, transferError);
        }
      }

      // 6. Consolidar informações no cliente principal (pegar a informação mais completa)
      const consolidatedData = {
        name: primaryClient.name,
        phone: primaryClient.phone,
        email: primaryClient.email,
        notes: primaryClient.notes,
        normalized_phone: normalizedPhone
      };

      // Usar email e notas mais completos se alguma duplicata tiver informações melhores
      for (const duplicate of duplicatesToRemove) {
        if (!consolidatedData.email && duplicate.email) {
          consolidatedData.email = duplicate.email;
        }
        if (!consolidatedData.notes && duplicate.notes) {
          consolidatedData.notes = duplicate.notes;
        }
        // Usar o nome mais longo (provavelmente mais completo)
        if (duplicate.name.length > consolidatedData.name.length) {
          consolidatedData.name = duplicate.name;
        }
      }

      // 7. Atualizar cliente principal com dados consolidados
      try {
        const { error: updatePrimaryError } = await supabase
          .from('clients')
          .update(consolidatedData)
          .eq('id', primaryClient.id);

        if (updatePrimaryError) {
          devError(`❌ [DEDUPLICAÇÃO] Erro ao atualizar cliente principal:`, updatePrimaryError);
        } else {
          devLog(`✅ [DEDUPLICAÇÃO] Cliente principal atualizado: ${consolidatedData.name}`);
        }
      } catch (updateError) {
        devError(`❌ [DEDUPLICAÇÃO] Erro na atualização do cliente principal:`, updateError);
      }

      // 8. Remover clientes duplicados
      for (const duplicateClient of duplicatesToRemove) {
        try {
          const { error: deleteError } = await supabase
            .from('clients')
            .delete()
            .eq('id', duplicateClient.id);

          if (deleteError) {
            devError(`❌ [DEDUPLICAÇÃO] Erro ao deletar duplicata ${duplicateClient.name}:`, deleteError);
          } else {
            devLog(`🗑️ [DEDUPLICAÇÃO] Duplicata removida: ${duplicateClient.name} (${duplicateClient.id})`);
            totalDuplicatesRemoved++;
          }
        } catch (deleteError) {
          devError(`❌ [DEDUPLICAÇÃO] Erro na remoção da duplicata:`, deleteError);
        }
      }

      totalClientsConsolidated++;
    }

    devLog(`✅ [DEDUPLICAÇÃO] Processo concluído:`);
    devLog(`   - Duplicatas encontradas: ${totalDuplicatesFound}`);
    devLog(`   - Duplicatas removidas: ${totalDuplicatesRemoved}`);
    devLog(`   - Clientes consolidados: ${totalClientsConsolidated}`);

    return {
      duplicatesFound: totalDuplicatesFound,
      duplicatesRemoved: totalDuplicatesRemoved,
      clientsConsolidated: totalClientsConsolidated
    };

  } catch (error) {
    devError('❌ [DEDUPLICAÇÃO] Erro fatal no processo:', error);
    throw error;
  }
};

/**
 * Busca clientes únicos para exibição, agrupando por telefone normalizado
 */
export const getUniqueClients = async (companyId: string) => {
  try {
    const { data: allClients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!allClients || allClients.length === 0) {
      return [];
    }

    // Agrupar por telefone normalizado e manter apenas o mais recente de cada grupo
    const uniqueClientsMap = new Map<string, any>();

    for (const client of allClients) {
      const normalizedPhone = normalizePhone(client.phone);
      
      if (!normalizedPhone) continue;

      if (!uniqueClientsMap.has(normalizedPhone)) {
        uniqueClientsMap.set(normalizedPhone, client);
      } else {
        // Se já existe, manter o mais recente
        const existing = uniqueClientsMap.get(normalizedPhone);
        if (new Date(client.created_at) > new Date(existing.created_at)) {
          uniqueClientsMap.set(normalizedPhone, client);
        }
      }
    }

    const uniqueClients = Array.from(uniqueClientsMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    devLog(`📊 [UNIQUE-CLIENTS] Retornando ${uniqueClients.length} clientes únicos de ${allClients.length} total`);

    return uniqueClients;

  } catch (error) {
    devError('❌ [UNIQUE-CLIENTS] Erro ao buscar clientes únicos:', error);
    throw error;
  }
};