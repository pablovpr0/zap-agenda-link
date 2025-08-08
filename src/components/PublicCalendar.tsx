
import StandardCalendar from './StandardCalendar';

interface PublicCalendarProps {
  availableDates: Date[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

const PublicCalendar = ({ availableDates, selectedDate, onDateSelect }: PublicCalendarProps) => {
  const handleDateSelect = (date: Date) => {
    // Convert Date to string in YYYY-MM-DD format
    const dateString = date.toISOString().split('T')[0];
    onDateSelect(dateString);
  };

  return (
    <StandardCalendar
      companyId=""
      onDateSelect={handleDateSelect}
      onAppointmentSelect={() => {}}
    />
  );
};

export default PublicCalendar;
