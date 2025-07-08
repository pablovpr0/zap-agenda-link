
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Users } from 'lucide-react';

interface AppointmentSettingsProps {
  appointmentInterval: number;
  maxSimultaneousAppointments: number;
  advanceBookingLimit: number;
  monthlyAppointmentsLimit: number;
  onAppointmentIntervalChange: (interval: number) => void;
  onMaxSimultaneousAppointmentsChange: (max: number) => void;
  onAdvanceBookingLimitChange: (limit: number) => void;
  onMonthlyAppointmentsLimitChange: (limit: number) => void;
}

const AppointmentSettings = ({
  appointmentInterval,
  maxSimultaneousAppointments,
  advanceBookingLimit,
  monthlyAppointmentsLimit,
  onAppointmentIntervalChange,
  onMaxSimultaneousAppointmentsChange,
  onAdvanceBookingLimitChange,
  onMonthlyAppointmentsLimitChange
}: AppointmentSettingsProps) => {
  return (
    <>
      {/* Limite de agendamentos mensais */}
      <div className="space-y-2">
        <Label htmlFor="monthlyLimit" className="flex items-center gap-2">
          <Users className="w-4 h-4 text-whatsapp-green" />
          Limite de Agendamentos por Cliente (por mês)
        </Label>
        <Input
          id="monthlyLimit"
          type="number"
          min="1"
          max="50"
          value={monthlyAppointmentsLimit}
          onChange={(e) => onMonthlyAppointmentsLimitChange(Number(e.target.value))}
          required
        />
        <p className="text-xs text-gray-500">
          Quantos agendamentos cada cliente pode fazer por mês
        </p>
      </div>

      {/* Configurações de agendamento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="appointmentInterval">Intervalo (minutos)</Label>
          <Input
            id="appointmentInterval"
            type="number"
            min="15"
            max="120"
            step="15"
            value={appointmentInterval}
            onChange={(e) => onAppointmentIntervalChange(Number(e.target.value))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxSimultaneousAppointments">Máx. Simultâneos</Label>
          <Input
            id="maxSimultaneousAppointments"
            type="number"
            min="1"
            max="10"
            value={maxSimultaneousAppointments}
            onChange={(e) => onMaxSimultaneousAppointmentsChange(Number(e.target.value))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="advanceBookingLimit">Limite Antecipação (dias)</Label>
          <Input
            id="advanceBookingLimit"
            type="number"
            min="1"
            max="365"
            value={advanceBookingLimit}
            onChange={(e) => onAdvanceBookingLimitChange(Number(e.target.value))}
            required
          />
        </div>
      </div>
    </>
  );
};

export default AppointmentSettings;
