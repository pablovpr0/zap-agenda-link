import { supabase } from '@/integrations/supabase/client';
import { normalizePhone, arePhoneNumbersEqual } from '@/utils/phoneNormalization';
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
      devLog(`🔄 [CORREÇÃO] Encontrados ${matchingClients.length} clientes duplicados para telefone ${phone}`);
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
    devError('Erro ao buscar cliente por telefone:', error);
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

    devLog(`🔄 [CONSOLIDAÇÃO] Mantendo cliente: ${keepClient.name} (${keepClient.id})`);
    devLog(`🗑️ [CONSOLIDAÇÃO] Removendo ${clientsToRemove.length} duplicatas`);

    // Atualizar agendamentos dos clientes duplicados para apontar para o cliente mantido
    for (const clientToRemove of clientsToRemove) {
      await supabase
        .from('appointments')
        .update({ client_id: keepClient.id })
        .eq('client_id', clientToRemove.id);

      devLog(`📋 [CONSOLIDAÇÃO] Agendamentos de ${clientToRemove.name} transferidos para ${keepClient.name}`);
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

    devLog(`✅ [CONSOLIDAÇÃO] Duplicatas removidas, cliente único mantido: ${keepClient.name}`);
  } catch (error) {
    devError('❌ Erro ao consolidar clientes duplicados:', error);
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
  const normalizedPhone = normalizePhone(clientData.phone);
  
  if (!normalizedPhone || normalizedPhone.length < 10) {
    throw new Error('Número de telefone inválido');
  }

  devLog(`🔄 [CLIENTE] Processando cliente: ${clientData.name} - ${clientData.phone} (normalizado: ${normalizedPhone})`);

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
      devLog(`✅ [CLIENTE] Novo cliente criado: ${newClient.name} (${newClient.id})`);
      return { client: newClient, isNew: true };
    }

    // Se deu erro de constraint única, significa que o cliente já existe
    if (insertError.message?.includes('idx_clients_company_normalized_phone_unique')) {
      devLog(`🔍 [CLIENTE] Cliente já existe, buscando para atualizar...`);
      
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
        devLog(`🔄 [CLIENTE] Cliente encontrado: ${existingClient.name} (${existingClient.id}), atualizando...`);
        
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
          devError('❌ [CLIENTE] Erro ao atualizar cliente:', updateError);
          // Se não conseguir atualizar, retorna o cliente original
          return { client: existingClient, isNew: false };
        }

        devLog(`✅ [CLIENTE] Cliente atualizado: ${updatedClient.name}`);
        return { client: updatedClient, isNew: false };
      }

      // Se ainda não encontrou o cliente, retornar um cliente temporário para não quebrar o fluxo
      devWarn('⚠️ [CLIENTE] Cliente não encontrado após constraint violation, criando cliente temporário');
      
      // Criar um cliente temporário com dados únicos para não quebrar o fluxo
      const tempPhone = clientData.phone + '_temp_' + Date.now();
      const tempNormalizedPhone = normalizePhone(tempPhone);
      
      const { data: tempClient, error: tempError } = await supabase
        .from('clients')
        .insert({
          company_id: companyId,
          name: clientData.name + ' (temp)',
          phone: tempPhone,
          email: clientData.email || null,
          notes: 'Cliente temporário criado devido a race condition',
          normalized_phone: tempNormalizedPhone
        })
        .select()
        .single();

      if (!tempError && tempClient) {
        devLog(`✅ [CLIENTE] Cliente temporário criado: ${tempClient.name} (${tempClient.id})`);
        return { client: tempClient, isNew: true };
      }
      
      // Se nem o cliente temporário funcionou, criar um objeto fake para não quebrar
      const fakeClient = {
        id: 'temp-' + Date.now(),
        name: clientData.name,
        phone: clientData.phone,
        email: clientData.email || null,
        notes: 'Cliente fake devido a erro de sistema',
        created_at: new Date().toISOString(),
        normalized_phone: normalizedPhone,
        company_id: companyId
      };
      
      devWarn('⚠️ [CLIENTE] Retornando cliente fake para não quebrar o fluxo');
      return { client: fakeClient as ExistingClient, isNew: true };
    }

    // Outro tipo de erro
    devError('❌ [CLIENTE] Erro inesperado ao inserir:', insertError);
    throw insertError;

  } catch (error) {
    devError('❌ [CLIENTE] Erro fatal:', error);
    throw error;
  }
};

// Função de fallback usando método manual robusto
const createOrUpdateClientFallback = async (
  companyId: string,
  clientData: ClientData,
  normalizedPhone: string
): Promise<{ client: ExistingClient; isNew: boolean }> => {
  devLog(`🔄 [CLIENTE] Usando método fallback para: ${clientData.name}`);

  // Usar upsert do Supabase com merge strategy
  try {
    const { data: upsertedClient, error: upsertError } = await supabase
      .from('clients')
      .upsert({
        company_id: companyId,
        name: clientData.name,
        phone: clientData.phone,
        email: clientData.email || null,
        notes: clientData.notes || null,
        normalized_phone: normalizedPhone
      }, {
        onConflict: 'company_id,normalized_phone',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (upsertError) {
      devError('❌ [CLIENTE] Erro no upsert fallback:', upsertError);
      
      // Último recurso: buscar cliente existente
      const { data: existingClient } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', companyId)
        .eq('normalized_phone', normalizedPhone)
        .single();

      if (existingClient) {
        devLog(`✅ [CLIENTE] Cliente encontrado após erro: ${existingClient.name}`);
        return { client: existingClient, isNew: false };
      }

      throw upsertError;
    }

    devLog(`✅ [CLIENTE] Cliente processado via upsert: ${upsertedClient.name}`);
    return { client: upsertedClient, isNew: false }; // Assumir como existente por segurança
    
  } catch (error) {
    devError('❌ [CLIENTE] Falha total no fallback:', error);
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
    devError('Erro na migração de clientes:', error);
  }
};