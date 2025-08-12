import { supabase } from '@/integrations/supabase/client';
import { normalizePhone, arePhoneNumbersEqual } from '@/utils/phoneNormalization';

export interface ClientData {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface ExistingClient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  created_at: string;
  normalized_phone: string;
}

/**
 * Busca um cliente existente pelo telefone normalizado
 * CORREÇÃO: Retorna sempre o cliente mais recente se houver duplicatas
 */
export const findClientByPhone = async (companyId: string, phone: string): Promise<ExistingClient | null> => {
  try {
    const normalizedPhone = normalizePhone(phone);
    
    if (!normalizedPhone || normalizedPhone.length < 10) {
      return null;
    }

    // CORREÇÃO: Buscar TODOS os clientes com telefone equivalente e retornar o mais recente
    const { data: allClients, error: allError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }); // Mais recente primeiro

    if (allError || !allClients) {
      return null;
    }

    // Procurar por telefones equivalentes
    const matchingClients = [];
    for (const client of allClients) {
      if (arePhoneNumbersEqual(client.phone, phone) || client.normalized_phone === normalizedPhone) {
        matchingClients.push(client);
      }
    }

    if (matchingClients.length === 0) {
      return null;
    }

    // Se encontrou múltiplos clientes com mesmo telefone, consolidar
    if (matchingClients.length > 1) {
      console.log(`🔄 [CORREÇÃO] Encontrados ${matchingClients.length} clientes duplicados para telefone ${phone}`);
      await consolidateDuplicateClients(companyId, matchingClients, normalizedPhone);
    }

    // Retornar o cliente mais recente
    const latestClient = matchingClients[0];
    
    // Garantir que o telefone normalizado esteja definido
    if (!latestClient.normalized_phone) {
      await supabase
        .from('clients')
        .update({ normalized_phone: normalizedPhone })
        .eq('id', latestClient.id);
      latestClient.normalized_phone = normalizedPhone;
    }

    return latestClient;
  } catch (error) {
    console.error('Erro ao buscar cliente por telefone:', error);
    return null;
  }
};

/**
 * NOVA FUNÇÃO: Consolida clientes duplicados mantendo o mais recente
 */
const consolidateDuplicateClients = async (
  companyId: string, 
  duplicateClients: ExistingClient[], 
  normalizedPhone: string
) => {
  try {
    // Ordenar por data de criação (mais recente primeiro)
    const sortedClients = duplicateClients.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const keepClient = sortedClients[0]; // Manter o mais recente
    const clientsToRemove = sortedClients.slice(1); // Remover os outros

    console.log(`🔄 [CONSOLIDAÇÃO] Mantendo cliente: ${keepClient.name} (${keepClient.id})`);
    console.log(`🗑️ [CONSOLIDAÇÃO] Removendo ${clientsToRemove.length} duplicatas`);

    // Atualizar agendamentos dos clientes duplicados para apontar para o cliente mantido
    for (const clientToRemove of clientsToRemove) {
      await supabase
        .from('appointments')
        .update({ client_id: keepClient.id })
        .eq('client_id', clientToRemove.id);

      console.log(`📋 [CONSOLIDAÇÃO] Agendamentos de ${clientToRemove.name} transferidos para ${keepClient.name}`);
    }

    // Remover clientes duplicados
    const idsToRemove = clientsToRemove.map(c => c.id);
    await supabase
      .from('clients')
      .delete()
      .in('id', idsToRemove);

    // Atualizar o cliente mantido com telefone normalizado
    await supabase
      .from('clients')
      .update({ normalized_phone: normalizedPhone })
      .eq('id', keepClient.id);

    console.log(`✅ [CONSOLIDAÇÃO] Duplicatas removidas, cliente único mantido: ${keepClient.name}`);
  } catch (error) {
    console.error('❌ Erro ao consolidar clientes duplicados:', error);
  }
};

/**
 * Cria ou atualiza um cliente, evitando duplicatas por telefone
 * AJUSTE 2: Telefone como identificador único - sistema aprimorado
 */
export const createOrUpdateClient = async (
  companyId: string, 
  clientData: ClientData
): Promise<{ client: ExistingClient; isNew: boolean }> => {
  try {
    const normalizedPhone = normalizePhone(clientData.phone);
    
    if (!normalizedPhone || normalizedPhone.length < 10) {
      throw new Error('Número de telefone inválido');
    }

    // AJUSTE 2: Verifica se já existe um cliente com este telefone (identificador único)
    const existingClient = await findClientByPhone(companyId, clientData.phone);

    if (existingClient) {
      console.log(`📞 [CORREÇÃO] Cliente encontrado pelo telefone: ${existingClient.name} (${existingClient.phone})`);
      
      // CORREÇÃO: Cliente já existe - SEMPRE atualizar com dados mais recentes
      const updateData: any = {
        name: clientData.name, // SEMPRE atualizar o nome (pode ter mudado)
        normalized_phone: normalizedPhone // Garantir que está definido
      };
      
      // Atualizar email se fornecido (mesmo que já exista)
      if (clientData.email) {
        updateData.email = clientData.email;
      }
      
      // Atualizar notas se fornecidas
      if (clientData.notes) {
        updateData.notes = clientData.notes;
      }

      // SEMPRE fazer a atualização para manter dados atualizados
      const { data: updatedClient, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', existingClient.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar cliente:', error);
        // Retornar cliente existente mesmo com erro de atualização
        return { client: existingClient, isNew: false };
      }

      console.log(`✅ [CORREÇÃO] Cliente atualizado: ${updatedClient.name} (mesmo telefone, dados atualizados)`);
      return { client: updatedClient, isNew: false };
    }

    // CORREÇÃO: Cliente não existe, criar novo
    const { data: newClient, error } = await supabase
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

    if (error) {
      throw error;
    }

    console.log(`✅ [CORREÇÃO] Novo cliente criado: ${newClient.name} (${newClient.phone})`);
    return { client: newClient, isNew: true };
  } catch (error) {
    console.error('Erro ao criar/atualizar cliente:', error);
    throw error;
  }
};

/**
 * Migra clientes existentes para adicionar telefone normalizado
 */
export const migrateExistingClients = async (companyId: string): Promise<void> => {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', companyId)
      .is('normalized_phone', null);

    if (error || !clients) {
      return;
    }

    for (const client of clients) {
      const normalizedPhone = normalizePhone(client.phone);
      if (normalizedPhone) {
        await supabase
          .from('clients')
          .update({ normalized_phone: normalizedPhone })
          .eq('id', client.id);
      }
    }
  } catch (error) {
    console.error('Erro na migração de clientes:', error);
  }
};