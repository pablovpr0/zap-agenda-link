
import StandardCalendar from './StandardCalendar';

interface PublicCalendarProps {
  availableDates: Date[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

const PublicCalendar = ({ availableDates, selectedDate, onDateSelect }: PublicCalendarProps) => {
  return (
    <StandardCalendar
      availableDates={availableDates}
      selectedDate={selectedDate}
      onDateSelect={onDateSelect}
      showNavigation={true}
      highlightToday={true}
    />
  );
};

export default PublicCalendar;
