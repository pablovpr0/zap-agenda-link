import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, setHours, setMinutes, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CompanySettings {
  id: string;
  company_id: string;
  slug: string;
  address?: string;
  phone?: string;
  working_days: number[];
  working_hours_start: string;
  working_hours_end: string;
  appointment_interval: number;
  max_simultaneous_appointments: number;
  advance_booking_limit: number;
  monthly_appointments_limit: number;
  instagram_url?: string;
  logo_url?: string;
  cover_image_url?: string;
  theme_color: string;
  welcome_message?: string;
}

interface Profile {
  id: string;
  company_name: string;
  business_type: string;
  profile_image_url?: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price?: number;
}

export const usePublicBooking = (companySlug: string) => {
  const { toast } = useToast();
  
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadCompanyData = async () => {
    try {
      // Buscar configurações da empresa pelo slug
      const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('*')
        .eq('slug', companySlug)
        .single();

      if (settingsError) throw settingsError;
      
      setCompanySettings(settings);

      // Buscar perfil da empresa
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', settings.company_id)
        .single();

      if (profileError) throw profileError;
      
      setProfile(profileData);

      // Buscar serviços ativos
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', settings.company_id)
        .eq('is_active', true)
        .order('name');

      if (servicesError) throw servicesError;
      
      setServices(servicesData || []);
    } catch (error: any) {
      console.error('Erro ao carregar dados da empresa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da empresa.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAvailableDates = () => {
    if (!companySettings) return [];
    
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < companySettings.advance_booking_limit; i++) {
      const date = addDays(today, i);
      const dayOfWeek = date.getDay();
      
      if (companySettings.working_days.includes(dayOfWeek)) {
        dates.push(date);
      }
    }
    
    return dates;
  };

  const generateAvailableTimes = async (selectedDate: string) => {
    if (!companySettings || !selectedDate) return [];
    
    const times = [];
    const [startHour, startMinute] = companySettings.working_hours_start.split(':').map(Number);
    const [endHour, endMinute] = companySettings.working_hours_end.split(':').map(Number);
    
    let currentTime = setMinutes(setHours(new Date(), startHour), startMinute);
    const endTime = setMinutes(setHours(new Date(), endHour), endMinute);
    
    while (currentTime < endTime) {
      times.push(format(currentTime, 'HH:mm'));
      currentTime = new Date(currentTime.getTime() + companySettings.appointment_interval * 60000);
    }
    
    // Buscar horários já agendados para esta data
    try {
      const { data: bookedAppointments, error } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('company_id', companySettings.company_id)
        .eq('appointment_date', selectedDate)
        .neq('status', 'cancelled');

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        return times;
      }

      // Filtrar horários já ocupados
      const bookedTimes = bookedAppointments?.map(apt => apt.appointment_time.substring(0, 5)) || [];
      const availableTimes = times.filter(time => !bookedTimes.includes(time));
      
      return availableTimes;
    } catch (error) {
      console.error('Erro ao verificar horários disponíveis:', error);
      return times;
    }
  };

  const checkMonthlyLimit = async (clientPhone: string) => {
    if (!companySettings || !companySettings.monthly_appointments_limit) {
      console.log('Limite mensal não configurado, permitindo agendamento');
      return true;
    }

    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // getMonth() retorna 0-11
      const currentYear = currentDate.getFullYear();
      
      // Criar datas de início e fim do mês atual
      const startOfMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      const startOfNextMonth = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
      
      console.log(`Verificando limite mensal para cliente ${clientPhone}`);
      console.log(`Período: ${startOfMonth} até ${startOfNextMonth}`);
      console.log(`Limite configurado: ${companySettings.monthly_appointments_limit}`);
      
      // Buscar agendamentos do mês atual pelo telefone do cliente
      const { data: monthlyAppointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          clients!inner(phone)
        `)
        .eq('company_id', companySettings.company_id)
        .eq('clients.phone', clientPhone)
        .gte('appointment_date', startOfMonth)
        .lt('appointment_date', startOfNextMonth)
        .neq('status', 'cancelled');

      if (error) {
        console.error('Erro ao verificar limite mensal:', error);
        return true; // Em caso de erro, permitir o agendamento
      }

      const appointmentCount = monthlyAppointments?.length || 0;
      console.log(`Cliente ${clientPhone} tem ${appointmentCount} agendamentos confirmados este mês`);
      
      const canBook = appointmentCount < companySettings.monthly_appointments_limit;
      console.log(`Pode agendar: ${canBook}`);
      
      return canBook;
    } catch (error) {
      console.error('Erro ao verificar limite mensal:', error);
      return true; // Em caso de erro, permitir o agendamento
    }
  };

  const submitBooking = async (formData: {
    selectedService: string;
    selectedDate: string;
    selectedTime: string;
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    notes: string;
  }) => {
    const { selectedService, selectedDate, selectedTime, clientName, clientPhone, clientEmail, notes } = formData;
    
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return false;
    }

    // Verificar limite mensal ANTES de tentar criar o agendamento
    const canBook = await checkMonthlyLimit(clientPhone);
    if (!canBook) {
      toast({
        title: "Limite de agendamentos atingido",
        description: `Este cliente já atingiu o limite de ${companySettings!.monthly_appointments_limit} agendamentos por mês.`,
        variant: "destructive",
      });
      return false;
    }

    setSubmitting(true);

    try {
      // Verificar se horário ainda está disponível
      const { data: conflictCheck, error: conflictError } = await supabase
        .from('appointments')
        .select('id')
        .eq('company_id', companySettings!.company_id)
        .eq('appointment_date', selectedDate)
        .eq('appointment_time', selectedTime)
        .neq('status', 'cancelled');

      if (conflictError) {
        console.error('Erro ao verificar conflitos:', conflictError);
      }

      if (conflictCheck && conflictCheck.length > 0) {
        toast({
          title: "Horário indisponível",
          description: "Este horário já foi ocupado. Por favor, escolha outro horário.",
          variant: "destructive",
        });
        return false;
      }

      // Criar ou buscar cliente - verificar apenas o telefone para evitar duplicação
      let clientId;
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', companySettings!.company_id)
        .eq('phone', clientPhone)
        .maybeSingle();

      if (existingClient) {
        clientId = existingClient.id;
        
        // Atualizar dados do cliente existente apenas se necessário
        await supabase
          .from('clients')
          .update({
            name: clientName,
            email: clientEmail || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', clientId);
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            company_id: companySettings!.company_id,
            name: clientName,
            phone: clientPhone,
            email: clientEmail || null,
            notes: notes || null,
          })
          .select('id')
          .single();

        if (clientError) {
          console.error('Erro ao criar cliente:', clientError);
          throw clientError;
        }
        clientId = newClient.id;
      }

      // Buscar duração do serviço
      const service = services.find(s => s.id === selectedService);

      // Criar agendamento
      const appointmentData = {
        company_id: companySettings!.company_id,
        client_id: clientId,
        service_id: selectedService,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        duration: service?.duration || 60,
        status: 'confirmed',
        notes: notes || null,
      };

      const { data: appointmentResult, error: appointmentError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select('*')
        .single();

      if (appointmentError) {
        console.error('Erro ao criar agendamento:', appointmentError);
        throw appointmentError;
      }

      // Corrigir formatação da data para a mensagem
      const appointmentDate = parseISO(selectedDate);
      const formattedDate = format(appointmentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      const professionalMessage = `🗓️ *NOVO AGENDAMENTO*\n\n` +
        `👤 *Cliente:* ${clientName}\n` +
        `📞 *Telefone:* ${clientPhone}\n` +
        `📅 *Data:* ${formattedDate}\n` +
        `⏰ *Horário:* ${selectedTime}\n` +
        `💼 *Serviço:* ${service?.name || 'Não especificado'}\n` +
        `${notes ? `📝 *Observações:* ${notes}\n` : ''}` +
        `\n✅ Agendamento confirmado automaticamente!`;

      toast({
        title: "Agendamento realizado!",
        description: `Agendamento confirmado para ${formattedDate} às ${selectedTime}.`,
      });

      // Enviar mensagem para o profissional via WhatsApp
      if (companySettings?.phone) {
        const cleanPhone = companySettings.phone.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(professionalMessage)}`;
        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
        }, 1000);
      }

      return true;
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar o agendamento. Tente novamente.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (companySlug) {
      loadCompanyData();
    }
  }, [companySlug]);

  return {
    companySettings,
    profile,
    services,
    loading,
    submitting,
    generateAvailableDates,
    generateAvailableTimes,
    submitBooking
  };
};
