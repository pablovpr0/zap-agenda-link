
import { User } from 'lucide-react';

interface MonthlyAppointment {
  id: string;
  appointment_time: string;
  appointment_date: string;
  status: string;
  duration: number;
  notes?: string;
  client_name: string;
  client_phone: string;
  service_name: string;
}

interface AppointmentInfoProps {
  appointment: MonthlyAppointment;
}

const AppointmentInfo = ({ appointment }: AppointmentInfoProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-gray-800 mb-1">{appointment.client_name}</p>
            <p className="text-sm text-gray-600">{appointment.client_phone}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 bg-primary rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 mb-1">Serviço</p>
            <p className="text-gray-800 font-medium">{appointment.service_name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentInfo;
