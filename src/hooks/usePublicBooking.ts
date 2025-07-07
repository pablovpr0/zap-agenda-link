
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CompanySettings {
  id: string;
  company_id: string;
  slug: string;
  address?: string;
  working_days: number[];
  working_hours_start: string;
  working_hours_end: string;
  appointment_interval: number;
  max_simultaneous_appointments: number;
  advance_booking_limit: number;
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

  const generateAvailableTimes = (selectedDate: string) => {
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
    
    return times;
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

    setSubmitting(true);

    try {
      console.log('Dados do agendamento:', formData);

      // Criar ou buscar cliente
      let clientId;
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', companySettings!.company_id)
        .eq('phone', clientPhone)
        .single();

      if (existingClient) {
        console.log('Cliente existente encontrado:', existingClient.id);
        clientId = existingClient.id;
        
        // Atualizar dados do cliente existente
        const { error: updateError } = await supabase
          .from('clients')
          .update({
            name: clientName,
            email: clientEmail || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', clientId);

        if (updateError) {
          console.error('Erro ao atualizar cliente:', updateError);
        }
      } else {
        console.log('Criando novo cliente');
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
        console.log('Novo cliente criado:', clientId);
      }

      // Buscar duração do serviço
      const service = services.find(s => s.id === selectedService);
      console.log('Serviço selecionado:', service);
      
      // Verificar conflitos de horário
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
          description: "Este horário já está ocupado. Por favor, escolha outro horário.",
          variant: "destructive",
        });
        return false;
      }

      // Criar agendamento com dados consistentes
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

      console.log('Dados do agendamento a serem inseridos:', appointmentData);

      const { data: appointmentResult, error: appointmentError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select('*')
        .single();

      if (appointmentError) {
        console.error('Erro ao criar agendamento:', appointmentError);
        throw appointmentError;
      }

      console.log('Agendamento criado com sucesso:', appointmentResult);

      // Gerar mensagem para contato com dados corretos
      const formattedDate = format(new Date(selectedDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      const contactMessage = `Olá! Acabei de agendar um horário:\n\n` +
        `📅 Data: ${formattedDate}\n` +
        `⏰ Horário: ${selectedTime}\n` +
        `💇 Serviço: ${service?.name}\n` +
        `👤 Cliente: ${clientName}\n` +
        `📱 Telefone: ${clientPhone}${clientEmail ? `\n📧 Email: ${clientEmail}` : ''}${notes ? `\n📝 Observações: ${notes}` : ''}\n\n` +
        `Agendamento confirmado! ✅`;

      console.log('Mensagem de contato:', contactMessage);

      toast({
        title: "Agendamento realizado!",
        description: `Agendamento confirmado para ${formattedDate} às ${selectedTime}.`,
      });

      // Redirecionar para contato via WhatsApp (opcional)
      const phoneNumber = companySettings?.instagram_url ? 
        companySettings.instagram_url.replace(/.*\//, '').replace(/\D/g, '') : 
        clientPhone.replace(/\D/g, '');
      
      if (phoneNumber) {
        const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(contactMessage)}`;
        window.open(whatsappUrl, '_blank');
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
