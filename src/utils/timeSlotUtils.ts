
export const isTimeDuringLunch = (time: string, lunchStart?: string, lunchEnd?: string): boolean => {
  if (!lunchStart || !lunchEnd) return false;

  const timeMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
  const lunchStartMinutes = parseInt(lunchStart.split(':')[0]) * 60 + parseInt(lunchStart.split(':')[1]);
  const lunchEndMinutes = parseInt(lunchEnd.split(':')[0]) * 60 + parseInt(lunchEnd.split(':')[1]);

  return timeMinutes >= lunchStartMinutes && timeMinutes < lunchEndMinutes;
};
