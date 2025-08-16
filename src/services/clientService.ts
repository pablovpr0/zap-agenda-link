
import { supabase } from '@/integrations/supabase/client';
import { normalizePhone, arePhoneNumbersEqual, isValidBrazilianPhone } from '@/utils/phoneNormalization';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

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

// Cache em memória para clientes recentes (otimização de performance)
const clientCache = new Map<string, { client: ExistingClient; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 segundos

/**
 * Busca um cliente existente pelo telefone normalizado com cache otimizado
 */
export const findClientByPhone = async (companyId: string, phone: string): Promise<ExistingClient | null> => {
  try {
    const normalizedPhone = normalizePhone(phone);
    
    if (!normalizedPhone || normalizedPhone.length < 10) {
      devWarn('📞 Telefone inválido para busca:', phone);
      return null;
    }

    // Verificar cache primeiro
    const cacheKey = `${companyId}-${normalizedPhone}`;
    const cached = clientCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      devLog(`📋 [CACHE] Cliente encontrado no cache: ${cached.client.name}`);
      return cached.client;
    }

    // Busca otimizada - apenas clientes com telefone normalizado
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', companyId)
      .eq('normalized_phone', normalizedPhone)
      .order('created_at', { ascending: false });

    if (error) {
      devError('❌ Erro ao buscar cliente por telefone:', error);
      return null;
    }

    if (!clients || clients.length === 0) {
      // Fallback: busca por telefone original (casos legados)
      const { data: legacyClients, error: legacyError } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (legacyError || !legacyClients) {
        return null;
      }

      // Procurar manualmente por telefones equivalentes
      const matchingClient = legacyClients.find(client => 
        arePhoneNumbersEqual(client.phone, phone)
      );

      if (matchingClient) {
        // Atualizar telefone normalizado do cliente legado
        await supabase
          .from('clients')
          .update({ normalized_phone: normalizedPhone })
          .eq('id', matchingClient.id);
        
        matchingClient.normalized_phone = normalizedPhone;
        
        // Adicionar ao cache
        clientCache.set(cacheKey, { client: matchingClient, timestamp: Date.now() });
        
        devLog(`🔄 [LEGACY] Cliente encontrado e normalizado: ${matchingClient.name}`);
        return matchingClient;
      }

      return null;
    }

    // Se encontrou múltiplos clientes, consolidar (caso raro após as correções)
    if (clients.length > 1) {
      devWarn(`⚠️ Encontrados ${clients.length} clientes duplicados para telefone ${phone}`);
      await consolidateDuplicateClients(companyId, clients, normalizedPhone);
    }

    const client = clients[0];
    
    // Adicionar ao cache
    clientCache.set(cacheKey, { client, timestamp: Date.now() });
    
    devLog(`✅ Cliente encontrado: ${client.name} (${client.phone})`);
    return client;

  } catch (error) {
    devError('❌ Erro ao buscar cliente por telefone:', error);
    return null;
  }
};

/**
 * Consolida clientes duplicados mantendo o mais recente
 */
const consolidateDuplicateClients = async (
  companyId: string, 
  duplicateClients: ExistingClient[], 
  normalizedPhone: string
) => {
  try {
    const sortedClients = duplicateClients.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const keepClient = sortedClients[0];
    const clientsToRemove = sortedClients.slice(1);

    devLog(`🔄 [CONSOLIDAÇÃO] Mantendo cliente: ${keepClient.name} (${keepClient.id})`);

    // Transferir agendamentos
    for (const clientToRemove of clientsToRemove) {
      await supabase
        .from('appointments')
        .update({ client_id: keepClient.id })
        .eq('client_id', clientToRemove.id);

      devLog(`📋 Agendamentos transferidos de ${clientToRemove.name} para ${keepClient.name}`);
    }

    // Remover duplicatas
    const idsToRemove = clientsToRemove.map(c => c.id);
    await supabase
      .from('clients')
      .delete()
      .in('id', idsToRemove);

    devLog(`✅ ${clientsToRemove.length} duplicatas removidas`);
  } catch (error) {
    devError('❌ Erro ao consolidar clientes duplicados:', error);
  }
};

/**
 * Cria ou atualiza um cliente usando lógica UPSERT otimizada
 */
export const createOrUpdateClient = async (
  companyId: string, 
  clientData: ClientData
): Promise<{ client: ExistingClient; isNew: boolean }> => {
  try {
    // Validação de entrada
    if (!clientData.name?.trim()) {
      throw new Error('Nome do cliente é obrigatório');
    }

    const normalizedPhone = normalizePhone(clientData.phone);
    
    if (!normalizedPhone || normalizedPhone.length < 10) {
      throw new Error('Número de telefone inválido');
    }

    if (!isValidBrazilianPhone(clientData.phone)) {
      devWarn('⚠️ Telefone pode não ser válido:', clientData.phone);
    }

    devLog(`🔍 [UPSERT] Processando cliente: ${clientData.name} (${clientData.phone})`);

    // Buscar cliente existente
    const existingClient = await findClientByPhone(companyId, clientData.phone);

    if (existingClient) {
      // Cliente existe - atualizar informações
      const updateData: any = {
        name: clientData.name.trim(),
        normalized_phone: normalizedPhone
      };
      
      if (clientData.email?.trim()) {
        updateData.email = clientData.email.trim();
      }
      
      if (clientData.notes?.trim()) {
        updateData.notes = clientData.notes.trim();
      }

      const { data: updatedClient, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', existingClient.id)
        .select()
        .single();

      if (error) {
        devError('❌ Erro ao atualizar cliente:', error);
        return { client: existingClient, isNew: false };
      }

      // Limpar cache
      const cacheKey = `${companyId}-${normalizedPhone}`;
      clientCache.delete(cacheKey);

      devLog(`✅ [UPSERT] Cliente atualizado: ${updatedClient.name}`);
      return { client: updatedClient, isNew: false };
    }

    // Cliente não existe - criar novo
    const newClientData: any = {
      company_id: companyId,
      name: clientData.name.trim(),
      phone: clientData.phone,
      normalized_phone: normalizedPhone
    };

    if (clientData.email?.trim()) {
      newClientData.email = clientData.email.trim();
    }

    if (clientData.notes?.trim()) {
      newClientData.notes = clientData.notes.trim();
    }

    const { data: newClient, error } = await supabase
      .from('clients')
      .insert(newClientData)
      .select()
      .single();

    if (error) {
      // Verificar se é erro de duplicação (condição de corrida)
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        devWarn('🔄 [RACE-CONDITION] Detectada condição de corrida, buscando cliente existente');
        const existingAfterError = await findClientByPhone(companyId, clientData.phone);
        if (existingAfterError) {
          return { client: existingAfterError, isNew: false };
        }
      }
      
      devError('❌ Erro ao criar cliente:', error);
      throw error;
    }

    devLog(`✅ [UPSERT] Novo cliente criado: ${newClient.name} (${newClient.phone})`);
    return { client: newClient, isNew: true };

  } catch (error) {
    devError('❌ Erro no upsert de cliente:', error);
    throw error;
  }
};

/**
 * Limpa o cache de clientes (útil para testes e debug)
 */
export const clearClientCache = () => {
  clientCache.clear();
  devLog('🧹 Cache de clientes limpo');
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
      if (normalizedPhone && normalizedPhone.length >= 10) {
        await supabase
          .from('clients')
          .update({ normalized_phone: normalizedPhone })
          .eq('id', client.id);
        
        devLog(`🔄 Cliente migrado: ${client.name} (${normalizedPhone})`);
      }
    }

    devLog(`✅ Migração concluída: ${clients.length} clientes processados`);
  } catch (error) {
    devError('❌ Erro na migração de clientes:', error);
  }
};
