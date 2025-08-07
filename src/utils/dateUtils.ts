
import { addDays, format, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getNowInBrazil } from '@/utils/timezone';

export const generateAvailableDates = (workingDays: number[], advanceBookingLimit: number) => {
  console.log('📅 Gerando datas disponíveis:', { workingDays, advanceBookingLimit });
  
  const dates = [];
  const today = getNowInBrazil(); // Usar horário de São Paulo
  
  console.log('🇧🇷 Data atual no Brasil:', {
    date: format(today, 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    dayOfWeek: today.getDay(),
    dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][today.getDay()]
  });
  
  // Mapear os dias da semana para debug
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  console.log('📅 Dias de trabalho configurados:', workingDays.map(day => `${day} (${dayNames[day]})`));
  
  for (let i = 0; i < advanceBookingLimit; i++) {
    const date = addDays(today, i);
    const dayOfWeek = date.getDay();
    
    if (workingDays.includes(dayOfWeek)) {
      dates.push(date);
      console.log(`✅ Dia ${format(date, 'dd/MM')} (${dayNames[dayOfWeek]}) incluído - é dia de trabalho`);
    } else {
      console.log(`❌ Dia ${format(date, 'dd/MM')} (${dayNames[dayOfWeek]}) excluído - não é dia de trabalho`);
    }
  }
  
  console.log('📅 Total de datas disponíveis:', dates.length);
  return dates;
};

export const generateTimeSlots = (
  workingHoursStart: string,
  workingHoursEnd: string,
  appointmentInterval: number,
  lunchBreakEnabled?: boolean,
  lunchStartTime?: string,
  lunchEndTime?: string
) => {
  console.log('🔧 generateTimeSlots chamada com:', {
    workingHoursStart,
    workingHoursEnd,
    appointmentInterval,
    lunchBreakEnabled,
    lunchStartTime,
    lunchEndTime
  });

  const times = [];
  const [startHour, startMinute] = workingHoursStart.split(':').map(Number);
  const [endHour, endMinute] = workingHoursEnd.split(':').map(Number);
  
  // Usar data base fixa para evitar problemas de timezone
  const baseDate = new Date('2000-01-01T00:00:00');
  let currentTime = setMinutes(setHours(baseDate, startHour), startMinute);
  const endTime = setMinutes(setHours(baseDate, endHour), endMinute);
  
  while (currentTime < endTime) {
    const timeString = format(currentTime, 'HH:mm');
    
    // Verificar se o horário não é durante o almoço (período completo)
    const isDuringLunch = isTimeDuringLunch(timeString, lunchBreakEnabled, lunchStartTime, lunchEndTime);
    
    if (!isDuringLunch) {
      times.push(timeString);
    } else {
      console.log(`🍽️ Horário ${timeString} bloqueado por estar no almoço`);
    }
    
    currentTime = new Date(currentTime.getTime() + appointmentInterval * 60000);
  }
  
  console.log('✅ generateTimeSlots resultado:', times);
  return times;
};

export const isTimeDuringLunch = (
  time: string,
  lunchBreakEnabled?: boolean,
  lunchStartTime?: string,
  lunchEndTime?: string
) => {
  console.log('🔍 isTimeDuringLunch verificando:', {
    time,
    lunchBreakEnabled,
    lunchStartTime,
    lunchEndTime
  });

  if (!lunchBreakEnabled || !lunchStartTime || !lunchEndTime) {
    console.log('❌ Almoço não habilitado ou horários não definidos');
    return false;
  }
  
  const timeMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
  const lunchStartMinutes = parseInt(lunchStartTime.split(':')[0]) * 60 + parseInt(lunchStartTime.split(':')[1]);
  const lunchEndMinutes = parseInt(lunchEndTime.split(':')[0]) * 60 + parseInt(lunchEndTime.split(':')[1]);
  
  // Corrigir a lógica: o período do almoço é INCLUSIVE no início e EXCLUSIVE no fim
  // Se alguém sai às 12:00 e volta às 15:00, não pode agendar das 12:00 até 14:59
  const isDuringLunch = timeMinutes >= lunchStartMinutes && timeMinutes < lunchEndMinutes;
  
  console.log('🔍 Cálculo do almoço:', {
    timeMinutes,
    lunchStartMinutes,
    lunchEndMinutes,
    isDuringLunch
  });
  
  return isDuringLunch;
};

export const formatAppointmentDate = (date: string) => {
  // Usar timezone brasileiro para formatação
  const appointmentDate = new Date(date + 'T12:00:00'); // Meio-dia para evitar problemas de timezone
  return format(appointmentDate, "dd 'de' MMMM 'de' yyyy", { 
    locale: ptBR,
    timeZone: 'America/Sao_Paulo'
  });
};
