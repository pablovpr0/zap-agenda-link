
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
      availableDates={availableDates}
      selectedDate={selectedDate}
      onDateSelect={handleDateSelect}
      showNavigation={true}
      highlightToday={true}
    />
  );
};

export default PublicCalendar;
