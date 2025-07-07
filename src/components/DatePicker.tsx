
import CalendarDatePicker from './CalendarDatePicker';

interface DatePickerProps {
  onDateSelect: (date: string) => void;
  selectedDate: string;
}

const DatePicker = ({ onDateSelect, selectedDate }: DatePickerProps) => {
  return <CalendarDatePicker onDateSelect={onDateSelect} selectedDate={selectedDate} />;
};

export default DatePicker;
