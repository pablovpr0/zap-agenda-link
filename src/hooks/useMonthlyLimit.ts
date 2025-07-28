
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getStorageData, MockCompanySettings, MockAppointment, STORAGE_KEYS } from '@/data/mockData';

export const useMonthlyLimit = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [checking, setChecking] = useState(false);

  const checkMonthlyLimit = async (clientPhone: string): Promise<boolean> => {
    if (!user) return false;

    setChecking(true);
    try {
      // Buscar configurações da empresa
      const settings = getStorageData<MockCompanySettings>(STORAGE_KEYS.COMPANY_SETTINGS, null);

      if (!settings?.monthly_appointments_limit) {
        console.log('Limite mensal não configurado');
        return true; // Se não há limite configurado, permite o agendamento
      }

      const monthlyLimit = settings.monthly_appointments_limit;
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      // Buscar agendamentos do mês atual para este cliente
      const appointments = getStorageData<MockAppointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
      const clients = getStorageData(STORAGE_KEYS.CLIENTS, []);
      
      const client = clients.find(c => c.phone === clientPhone && c.company_id === user.id);
      if (!client) return true;

      const monthlyAppointments = appointments.filter(apt => 
        apt.company_id === user.id &&
        apt.client_id === client.id &&
        apt.appointment_date.startsWith(currentMonth) &&
        apt.status !== 'cancelled'
      );

      const appointmentCount = monthlyAppointments.length;
      console.log(`Cliente ${clientPhone} tem ${appointmentCount} agendamentos este mês. Limite: ${monthlyLimit}`);

      if (appointmentCount >= monthlyLimit) {
        toast({
          title: "Limite de agendamentos atingido",
          description: `Este cliente já atingiu o limite de ${monthlyLimit} agendamentos por mês.`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao verificar limite mensal:', error);
      return true; // Em caso de erro, permite o agendamento
    } finally {
      setChecking(false);
    }
  };

  return {
    checkMonthlyLimit,
    checking
  };
};
