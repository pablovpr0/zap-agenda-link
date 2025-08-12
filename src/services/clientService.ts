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
 */
export const findClientByPhone = async (companyId: string, phone: string): Promise<ExistingClient | null> => {
  try {
    const normalizedPhone = normalizePhone(phone);
    
    if (!normalizedPhone || normalizedPhone.length < 10) {
      return null;
    }

    // Busca por telefone normalizado exato
    const { data: exactMatch, error: exactError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', companyId)
      .eq('normalized_phone', normalizedPhone)
      .limit(1)
      .single();

    if (!exactError && exactMatch) {
      return exactMatch;
    }

    // Se não encontrou por telefone normalizado, busca todos os clientes e compara
    const { data: allClients, error: allError } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', companyId);

    if (allError || !allClients) {
      return null;
    }

    // Procura por telefones equivalentes
    for (const client of allClients) {
      if (arePhoneNumbersEqual(client.phone, phone)) {
        // Atualiza o telefone normalizado se não estiver definido
        if (!client.normalized_phone) {
          await supabase
            .from('clients')
            .update({ normalized_phone: normalizedPhone })
            .eq('id', client.id);
        }
        return { ...client, normalized_phone: normalizedPhone };
      }
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar cliente por telefone:', error);
    return null;
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
      console.log(`📞 [AJUSTE 2] Cliente encontrado pelo telefone: ${existingClient.name} (${existingClient.phone})`);
      
      // Cliente já existe - AJUSTE 2: Apenas vincula ao agendamento existente, sem duplicar
      const updateData: any = {};
      
      // Atualiza apenas campos vazios para preservar dados existentes
      if (!existingClient.email && clientData.email) {
        updateData.email = clientData.email;
      }
      
      if (!existingClient.notes && clientData.notes) {
        updateData.notes = clientData.notes;
      }

      // Garante que o telefone normalizado esteja definido
      if (!existingClient.normalized_phone) {
        updateData.normalized_phone = normalizedPhone;
      }

      // Se há algo para atualizar, faz a atualização
      if (Object.keys(updateData).length > 0) {
        const { data: updatedClient, error } = await supabase
          .from('clients')
          .update(updateData)
          .eq('id', existingClient.id)
          .select()
          .single();

        if (error) {
          console.error('Erro ao atualizar cliente:', error);
          return { client: existingClient, isNew: false };
        }

        console.log(`✅ [AJUSTE 2] Cliente atualizado: ${updatedClient.name}`);
        return { client: updatedClient, isNew: false };
      }

      return { client: existingClient, isNew: false };
    }

    // CORREÇÃO DUPLICAÇÃO: Verificação final antes de criar + proteção contra condição de corrida
    const finalCheck = await findClientByPhone(companyId, clientData.phone);
    if (finalCheck) {
      console.log(`📞 [CORREÇÃO DUPLICAÇÃO] Cliente encontrado na verificação final: ${finalCheck.name}`);
      return { client: finalCheck, isNew: false };
    }

    // AJUSTE 2: Cliente não existe, cria um novo com telefone como identificador único
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
      // CORREÇÃO DUPLICAÇÃO: Se erro de duplicação, tentar buscar o cliente que foi criado por outro processo
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        console.log(`🔄 [CORREÇÃO DUPLICAÇÃO] Erro de duplicação detectado, buscando cliente existente`);
        const existingAfterError = await findClientByPhone(companyId, clientData.phone);
        if (existingAfterError) {
          return { client: existingAfterError, isNew: false };
        }
      }
      throw error;
    }

    console.log(`✅ [CORREÇÃO DUPLICAÇÃO] Novo cliente criado: ${newClient.name} (${newClient.phone})`);
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