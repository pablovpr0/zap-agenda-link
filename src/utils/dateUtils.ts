
import { addDays, format, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const generateAvailableDates = (workingDays: number[], advanceBookingLimit: number) => {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < advanceBookingLimit; i++) {
    const date = addDays(today, i);
    const dayOfWeek = date.getDay();
    
    if (workingDays.includes(dayOfWeek)) {
      dates.push(date);
    }
  }
  
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
  
  let currentTime = setMinutes(setHours(new Date(), startHour), startMinute);
  const endTime = setMinutes(setHours(new Date(), endHour), endMinute);
  
  while (currentTime < endTime) {
    const timeString = format(currentTime, 'HH:mm');
    
    // Verificar se o horário não é durante o almoço
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
  
  const isDuringLunch = timeMinutes >= lunchStartMinutes && timeMinutes < lunchEndMinutes;
  
  console.log('🔍 Cálculo:', {
    timeMinutes,
    lunchStartMinutes,
    lunchEndMinutes,
    isDuringLunch
  });
  
  return isDuringLunch;
};

export const formatAppointmentDate = (date: string) => {
  const appointmentDate = new Date(date + 'T00:00:00');
  return format(appointmentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};
