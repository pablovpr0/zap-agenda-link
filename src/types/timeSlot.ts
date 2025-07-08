
export interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

export interface TimeSlotPickerProps {
  selectedDate: string;
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  companyId: string;
  serviceId?: string;
  excludeAppointmentId?: string;
}
