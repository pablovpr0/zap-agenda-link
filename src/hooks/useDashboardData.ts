
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
// Removido import não utilizado
import { generatePublicBookingUrl } from '@/lib/domainConfig';
import { supabase } from '@/integrations/supabase/client';
import { DashboardData } from '@/types/dashboard';
import { getNowInBrazil, getTodayInBrazil } from '@/utils/timezone';
import { devLog, devError } from '@/utils/console';

export const useDashboardData = (companyName?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [bookingLink, setBookingLink] = useState<string>('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    todayAppointments: 0,
    totalClients: 0,
    monthlyRevenue: 0,
    completionRate: 0,
    bookingLink: '',
    recentAppointments: [],
    todayAppointmentsList: []
  });

  const loadData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch company settings from the original table (for compatibility)
      const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        devError('Error fetching company settings:', settingsError);
      }
      
      setCompanySettings(settings);
      
      let publicUrl = '';
      if (settings?.slug) {
        publicUrl = generatePublicBookingUrl(settings.slug);
        setBookingLink(publicUrl);
        setDashboardData(prev => ({ ...prev, bookingLink: publicUrl }));
      }

      // Use Brazil timezone for dates
      const today = getTodayInBrazil();
      
      // Today's appointments with client and service data
      const { data: todayAppointments, error: todayError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_time,
          status,
          clients!inner(name, phone),
          services!inner(name)
        `)
        .eq('company_id', user.id)
        .eq('appointment_date', today)
        .order('appointment_time');

      if (todayError) {
        devError('Error fetching today appointments:', todayError);
      }

      // Total clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', user.id);

      if (clientsError) {
        devError('Error fetching clients:', clientsError);
      }

      // Monthly revenue - only from COMPLETED appointments (not scheduled)
      const currentMonth = getNowInBrazil();
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: completedAppointments, error: monthlyError } = await supabase
        .from('appointments')
        .select('service_id, services(price)')
        .eq('company_id', user.id)
        .gte('appointment_date', firstDay)
        .lte('appointment_date', lastDay)
        .eq('status', 'completed'); // Only count completed appointments for revenue

      if (monthlyError) {
        devError('Error fetching completed appointments:', monthlyError);
      }

      // Calculate monthly revenue from completed appointments
      const monthlyRevenue = completedAppointments?.reduce((total, apt: any) => {
        return total + (apt.services?.price || 0);
      }, 0) || 0;

      // Recent appointments - ordenar por data e hora do agendamento
      const { data: recentAppointments, error: recentError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          clients(name, phone),
          services(name)
        `)
        .eq('company_id', user.id)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false })
        .limit(5);

      if (recentError) {
        devError('Error fetching recent appointments:', recentError);
      }

      // Format data
      const formattedTodayList = (todayAppointments || []).map((apt: any) => ({
        id: apt.id,
        appointment_time: apt.appointment_time,
        status: apt.status,
        client_name: apt.clients?.name || 'Cliente',
        client_phone: apt.clients?.phone || '',
        service_name: apt.services?.name || 'Serviço'
      }));

      const formattedRecentList = (recentAppointments || []).map((apt: any) => ({
        id: apt.id,
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        status: apt.status,
        client_name: apt.clients?.name || 'Cliente',
        client_phone: apt.clients?.phone || '',
        service_name: apt.services?.name || 'Serviço'
      }));

      setDashboardData({
        todayAppointments: todayAppointments?.length || 0,
        totalClients: clients?.length || 0,
        monthlyRevenue,
        completionRate: 85, // Mock completion rate
        bookingLink: publicUrl,
        recentAppointments: formattedRecentList,
        todayAppointmentsList: formattedTodayList
      });

    } catch (error) {
      devError('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  // Escutar atualizações de configurações para recarregar dados
  useEffect(() => {
    const handleSettingsUpdated = () => {
      devLog('Configurações atualizadas detectadas, recarregando dashboard...');
      if (user?.id) {
        loadData();
      }
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdated);
    
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdated);
    };
  }, [user?.id]);

  const handleCopyLink = async () => {
    if (!bookingLink) return;
    
    try {
      await navigator.clipboard.writeText(bookingLink);
      setLinkCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  const handleViewPublicPage = () => {
    if (bookingLink) {
      window.open(bookingLink, '_blank');
    }
  };

  const handleShareWhatsApp = () => {
    if (!bookingLink) return;
    
    const message = `Olá! Você pode agendar um horário comigo através deste link: ${bookingLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return {
    companySettings,
    bookingLink,
    linkCopied,
    loading,
    data: dashboardData,
    refreshData: loadData,
    handleCopyLink,
    handleViewPublicPage,
    handleShareWhatsApp
  };
};
