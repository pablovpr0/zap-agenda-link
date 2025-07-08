
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
  const times = [];
  const [startHour, startMinute] = workingHoursStart.split(':').map(Number);
  const [endHour, endMinute] = workingHoursEnd.split(':').map(Number);
  
  let currentTime = setMinutes(setHours(new Date(), startHour), startMinute);
  const endTime = setMinutes(setHours(new Date(), endHour), endMinute);
  
  while (currentTime < endTime) {
    const timeString = format(currentTime, 'HH:mm');
    
    // Verificar se o horário não é durante o almoço
    if (!isTimeDuringLunch(timeString, lunchBreakEnabled, lunchStartTime, lunchEndTime)) {
      times.push(timeString);
    }
    
    currentTime = new Date(currentTime.getTime() + appointmentInterval * 60000);
  }
  
  return times;
};

export const isTimeDuringLunch = (
  time: string,
  lunchBreakEnabled?: boolean,
  lunchStartTime?: string,
  lunchEndTime?: string
) => {
  if (!lunchBreakEnabled || !lunchStartTime || !lunchEndTime) {
    return false;
  }
  
  const timeMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
  const lunchStartMinutes = parseInt(lunchStartTime.split(':')[0]) * 60 + parseInt(lunchStartTime.split(':')[1]);
  const lunchEndMinutes = parseInt(lunchEndTime.split(':')[0]) * 60 + parseInt(lunchEndTime.split(':')[1]);
  
  return timeMinutes >= lunchStartMinutes && timeMinutes < lunchEndMinutes;
};

export const formatAppointmentDate = (date: string) => {
  const appointmentDate = new Date(date + 'T00:00:00');
  return format(appointmentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};
