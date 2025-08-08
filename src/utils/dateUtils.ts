
import { addDays, format, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getNowInBrazil } from '@/utils/timezone';

export const generateAvailableDates = (workingDays: number[], advanceBookingLimit: number) => {
  const dates = [];
  const today = getNowInBrazil(); // Usar horário de São Paulo
  
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
  
  // Corrigir a lógica: o período do almoço é INCLUSIVE no início e EXCLUSIVE no fim
  // Se alguém sai às 12:00 e volta às 15:00, não pode agendar das 12:00 até 14:59
  const isDuringLunch = timeMinutes >= lunchStartMinutes && timeMinutes < lunchEndMinutes;
  
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

export const formatAppointmentDateWithWeekday = (date: string) => {
  // Usar timezone brasileiro para formatação com dia da semana
  const appointmentDate = new Date(date + 'T12:00:00'); // Meio-dia para evitar problemas de timezone
  
  // Usar toLocaleDateString com timezone brasileiro
  const formattedDate = appointmentDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Sao_Paulo'
  });
  
  return formattedDate;
};
