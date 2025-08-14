
import { supabase } from '@/integrations/supabase/client';
import { getTodayInBrazil, getCurrentTimeInBrazil } from '@/utils/timezone';
import { devLog, devError } from '@/utils/console';

/**
 * VERSÃO ULTRA SIMPLES - COM TIMEZONE CORRETO DO BRASIL
 * Usa timezone America/Sao_Paulo para todas as operações
 */
export const getSimpleAvailableTimes = async (
  companyId: string,
  selectedDate: string
): Promise<string[]> => {
  devLog(`🔄 [BRASIL] Buscando horários para ${companyId} em ${selectedDate}`);

  try {
    // 1. Verificar se a data não é passada (usando timezone do Brasil)
    const today = getTodayInBrazil();
    if (selectedDate < today) {
      devLog(`❌ [BRASIL] Data ${selectedDate} é anterior a hoje (${today})`);
      return [];
    }

    // 2. Buscar configuração do dia da semana
    const date = new Date(selectedDate + 'T12:00:00');
    const dayOfWeek = date.getDay();

    devLog(`📅 [BRASIL] Verificando dia da semana: ${dayOfWeek}`);

    const { data: schedule } = await supabase
      .from('daily_schedules')
      .select('start_time, end_time, is_active')
      .eq('company_id', companyId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single();

    if (!schedule) {
      devLog(`❌ [BRASIL] Nenhuma configuração ativa para o dia ${dayOfWeek}`);
      return [];
    }

    devLog(`✅ [BRASIL] Horário de funcionamento: ${schedule.start_time} - ${schedule.end_time}`);

    // 3. Buscar TODOS os agendamentos não cancelados para a data
    const { data: appointments } = await supabase
      .from('appointments')
      .select('appointment_time, status')
      .eq('company_id', companyId)
      .eq('appointment_date', selectedDate)
      .neq('status', 'cancelled');

    devLog(`📋 [BRASIL] Agendamentos encontrados: ${appointments?.length || 0}`);

    // 4. Criar lista de horários ocupados
    const occupiedTimes = new Set<string>();
    if (appointments) {
      appointments.forEach(apt => {
        // Converter "09:00:00" para "09:00"
        const timeSlot = apt.appointment_time.substring(0, 5);
        occupiedTimes.add(timeSlot);
        devLog(`🚫 [BRASIL] Horário ocupado: ${timeSlot} (${apt.status})`);
      });
    }

    // 5. Gerar todos os slots de 30 em 30 minutos
    const availableSlots: string[] = [];
    const [startHour, startMin] = schedule.start_time.split(':').map(Number);
    const [endHour, endMin] = schedule.end_time.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Se for hoje, obter hora atual no horário do Brasil
    let currentMinutes = 0;
    if (selectedDate === today) {
      try {
        const currentTime = getCurrentTimeInBrazil();
        const [currentHour, currentMin] = currentTime.split(':').map(Number);
        currentMinutes = currentHour * 60 + currentMin;
        devLog(`⏰ [BRASIL] Hora atual no Brasil: ${currentTime} (${currentMinutes} minutos)`);
      } catch (error) {
        devLog(`⚠️ [BRASIL] Não foi possível obter hora atual`);
      }
    }

    // Gerar slots
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      // Pular horários passados se for hoje (com margem de 30 minutos)
      if (selectedDate === today && minutes <= currentMinutes + 30) {
        continue;
      }

      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const timeSlot = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

      // Verificar se não está ocupado
      if (!occupiedTimes.has(timeSlot)) {
        availableSlots.push(timeSlot);
        devLog(`✅ [BRASIL] ${timeSlot} - DISPONÍVEL`);
      } else {
        devLog(`❌ [BRASIL] ${timeSlot} - OCUPADO`);
      }
    }

    devLog(`🎯 [BRASIL] RESULTADO: ${availableSlots.length} horários disponíveis`);
    devLog(`🕐 [BRASIL] Horários: [${availableSlots.join(', ')}]`);

    return availableSlots;

  } catch (error) {
    devError('❌ [BRASIL] Erro:', error);
    return [];
  }
};
