
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, User, MessageSquare } from 'lucide-react';
import AppointmentActions from './AppointmentActions';
import AppointmentInfo from './AppointmentInfo';

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

interface AppointmentCardProps {
  appointment: MonthlyAppointment;
  index: number;
  totalAppointments: number;
  onWhatsAppClick: (phone: string, clientName: string, appointmentDate?: string, appointmentTime?: string) => void;
  onCancelClick: (phone: string, clientName: string) => void;
  onRescheduleClick: (phone: string, clientName: string) => void;
  onDeleteClick: () => void;
  onRefresh: () => void;
}

const AppointmentCard = ({
  appointment,
  index,
  totalAppointments,
  onWhatsAppClick,
  onCancelClick,
  onRescheduleClick,
  onDeleteClick,
  onRefresh
}: AppointmentCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'cancelled':
        return 'Cancelado';
      case 'completed':
        return 'Concluído';
      default:
        return status;
    }
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 md:p-6 space-y-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        {/* Header do Card */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
              <Clock className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="font-semibold text-gray-800">
                {appointment.appointment_time.substring(0, 5)}
              </span>
            </div>
            <Badge className={`text-xs font-medium border ${getStatusColor(appointment.status)}`}>
              {getStatusLabel(appointment.status)}
            </Badge>
          </div>
          
          <AppointmentActions
            appointment={appointment}
            onWhatsAppClick={onWhatsAppClick}
            onCancelClick={onCancelClick}
            onRescheduleClick={onRescheduleClick}
            onDeleteClick={onDeleteClick}
            onRefresh={onRefresh}
          />
        </div>

        <AppointmentInfo appointment={appointment} />

        {/* Observações */}
        {appointment.notes && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Observações:
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">{appointment.notes}</p>
          </div>
        )}
      </div>
      
      {index < totalAppointments - 1 && (
        <Separator className="my-4" />
      )}
    </div>
  );
};

export default AppointmentCard;
