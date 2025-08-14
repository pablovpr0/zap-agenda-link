import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  getCompanyAppointments, 
  getTodayAppointments, 
  createAppointment, 
  updateAppointment,
  cancelAppointment,
  AppointmentData 
} from '@/services/appointmentService';
import { getTodayInBrazil, debugTimezone } from '@/utils/timezone';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

export const useAppointments = (dateRange?: { start?: string; end?: string }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug timezone na inicialização
  useEffect(() => {
    debugTimezone();
  }, []);

  // Carregar agendamentos
  const loadAppointments = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const data = await getCompanyAppointments(
        user.id, 
        dateRange?.start, 
        dateRange?.end
      );
      
      setAppointments(data);

      // Carregar agendamentos de hoje separadamente
      const todayData = await getTodayAppointments(user.id);
      setTodayAppointments(todayData);

      devLog('📅 Appointments loaded:', {
        total: data.length,
        today: todayData.length,
        todayDate: getTodayInBrazil()
      });

    } catch (err: any) {
      setError(err.message || 'Erro ao carregar agendamentos');
      devError('❌ Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar agendamentos quando user ou dateRange mudar
  useEffect(() => {
    loadAppointments();
  }, [user?.id, dateRange?.start, dateRange?.end]);

  // Criar novo agendamento
  const createNewAppointment = async (appointmentData: Omit<AppointmentData, 'company_id'>) => {
    if (!user?.id) throw new Error('Usuário não autenticado');

    try {
      const newAppointment = await createAppointment({
        ...appointmentData,
        company_id: user.id
      });

      // Recarregar lista
      await loadAppointments();
      
      return newAppointment;
    } catch (error) {
      devError('❌ Error creating appointment:', error);
      throw error;
    }
  };

  // Atualizar agendamento
  const updateExistingAppointment = async (appointmentId: string, updates: Partial<AppointmentData>) => {
    try {
      const updatedAppointment = await updateAppointment(appointmentId, updates);
      
      // Recarregar lista
      await loadAppointments();
      
      return updatedAppointment;
    } catch (error) {
      devError('❌ Error updating appointment:', error);
      throw error;
    }
  };

  // Cancelar agendamento
  const cancelExistingAppointment = async (appointmentId: string, reason?: string) => {
    try {
      const cancelledAppointment = await cancelAppointment(appointmentId, reason);
      
      // Recarregar lista
      await loadAppointments();
      
      return cancelledAppointment;
    } catch (error) {
      devError('❌ Error cancelling appointment:', error);
      throw error;
    }
  };

  // Filtrar agendamentos por status
  const getAppointmentsByStatus = (status: string) => {
    return appointments.filter(apt => apt.status === status);
  };

  // Estatísticas
  const stats = {
    total: appointments.length,
    today: todayAppointments.length,
    scheduled: getAppointmentsByStatus('scheduled').length,
    confirmed: getAppointmentsByStatus('confirmed').length,
    completed: getAppointmentsByStatus('completed').length,
    cancelled: getAppointmentsByStatus('cancelled').length
  };

  return {
    appointments,
    todayAppointments,
    loading,
    error,
    stats,
    actions: {
      refresh: loadAppointments,
      create: createNewAppointment,
      update: updateExistingAppointment,
      cancel: cancelExistingAppointment,
      getByStatus: getAppointmentsByStatus
    }
  };
};