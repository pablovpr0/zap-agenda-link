import { supabase } from '@/integrations/supabase/client';
import { BookingFormData, CompanySettings, Service } from '@/types/publicBooking';
import { Professional } from '@/services/professionalsService';
import { formatAppointmentDate } from '@/utils/dateUtils';

// Input validation utilities
const validatePhoneNumber = (phone: string): string => {
  if (!phone) throw new Error('Número de telefone é obrigatório');
  
  // Remove all non-digit characters except + and ()
  const cleanPhone = phone.replace(/[^0-9+()-]/g, '');
  
  // Check length
  if (cleanPhone.length < 10 || cleanPhone.length > 20) {
    throw new Error('Número de telefone deve ter entre 10 e 20 dígitos');
  }
  
  return cleanPhone;
};

const validateName = (name: string): string => {
  if (!name) throw new Error('Nome é obrigatório');
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    throw new Error('Nome deve ter entre 2 e 100 caracteres');
  }
  
  // Basic XSS protection
  if (/<[^>]*>/.test(trimmedName)) {
    throw new Error('Nome contém caracteres não permitidos');
  }
  
  return trimmedName;
};

const validateEmail = (email: string | undefined): string | null => {
  if (!email) return null;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Formato de email inválido');
  }
  
  return email;
};

// Rate limiting check - using direct SQL call since function may not be in types yet
const checkRateLimit = async (identifier: string, actionType: string) => {
  try {
    // Use direct SQL query instead of RPC to avoid type issues
    const { data, error } = await supabase
      .from('rate_limits')
      .select('attempts, window_start')
      .eq('identifier', identifier)
      .eq('action_type', actionType)
      .gte('window_start', new Date(Date.now() - 15 * 60 * 1000).toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.warn('Rate limit check failed:', error);
      return true; // Allow if rate limit check fails
    }
    
    if (!data) {
      // First attempt - insert new record
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert({
          identifier,
          action_type: actionType,
          attempts: 1,
          window_start: new Date().toISOString()
        });
      
      if (insertError) {
        console.warn('Rate limit insert failed:', insertError);
      }
      return true;
    }
    
    if (data.attempts >= 5) {
      return false; // Rate limit exceeded
    }
    
    // Increment attempts
    const { error: updateError } = await supabase
      .from('rate_limits')
      .update({ attempts: data.attempts + 1 })
      .eq('identifier', identifier)
      .eq('action_type', actionType)
      .eq('window_start', data.window_start);
    
    if (updateError) {
      console.warn('Rate limit update failed:', updateError);
    }
    
    return true;
    
  } catch (error) {
    console.warn('Rate limit check error:', error);
    return true; // Allow if rate limit check fails
  }
};

export const createAppointment = async (
  formData: BookingFormData,
  companySettings: CompanySettings,
  services: Service[],
  professionals: Professional[]
) => {
  const { selectedService, selectedProfessional, selectedDate, selectedTime, clientName, clientPhone, clientEmail } = formData;

  console.log('🔒 Starting secure appointment creation process...');
  
  // Input validation
  try {
    const validatedName = validateName(clientName);
    const validatedPhone = validatePhoneNumber(clientPhone);
    const validatedEmail = validateEmail(clientEmail);
    
    console.log('✅ Input validation passed');
    
    // Rate limiting check
    const rateLimitOk = await checkRateLimit(validatedPhone, 'booking');
    if (!rateLimitOk) {
      throw new Error('Muitas tentativas de agendamento. Tente novamente em 15 minutos.');
    }
    
    // Validate company settings
    if (!companySettings?.company_id) {
      console.error('🚫 Company settings invalid');
      throw new Error('Configurações da empresa não encontradas');
    }

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(companySettings.company_id)) {
      console.error('🚫 Invalid company UUID');
      throw new Error('ID da empresa inválido');
    }

    console.log('✅ Company validation passed');

    // Find service details
    const service = services.find(s => s.id === selectedService);
    if (!service) {
      throw new Error('Serviço não encontrado');
    }

    // Create client using secure function
    console.log('👤 Creating/updating client...');
    const { data: clientId, error: clientError } = await supabase.rpc('create_public_client', {
      p_company_id: companySettings.company_id,
      p_name: validatedName,
      p_phone: validatedPhone,
      p_email: validatedEmail
    });

    if (clientError) {
      console.error('❌ Client creation error:', clientError);
      throw new Error(`Erro ao processar cliente: ${clientError.message}`);
    }

    if (!clientId) {
      throw new Error('Erro ao criar cliente');
    }

    console.log('✅ Client processed:', clientId);

    // Create appointment using secure function
    console.log('📅 Creating appointment...');
    const { data: appointmentId, error: appointmentError } = await supabase.rpc('create_public_appointment', {
      p_company_id: companySettings.company_id,
      p_client_id: clientId,
      p_service_id: selectedService,
      p_professional_id: selectedProfessional || null,
      p_appointment_date: selectedDate,
      p_appointment_time: selectedTime,
      p_duration: service.duration || 60
    });

    if (appointmentError) {
      console.error('❌ Appointment creation error:', appointmentError);
      throw new Error(`Erro ao criar agendamento: ${appointmentError.message}`);
    }

    if (!appointmentId) {
      throw new Error('Erro ao criar agendamento');
    }

    console.log('✅ Appointment created:', appointmentId);

    return {
      appointment: { id: appointmentId },
      service,
      formattedDate: formatAppointmentDate(selectedDate),
      professionalName: selectedProfessional 
        ? professionals.find(p => p.id === selectedProfessional)?.name || 'Profissional'
        : 'Qualquer profissional'
    };

  } catch (error: any) {
    console.error('❌ Secure appointment creation failed:', error);
    throw error;
  }
};

export const generateWhatsAppMessage = (
  clientName: string,
  clientPhone: string,
  formattedDate: string,
  selectedTime: string,
  serviceName: string,
  professionalName: string
) => {
  return `🗓️ *NOVO AGENDAMENTO*\n\n` +
    `👤 *Cliente:* ${clientName}\n` +
    `📞 *Telefone:* ${clientPhone}\n` +
    `📅 *Data:* ${formattedDate}\n` +
    `⏰ *Horário:* ${selectedTime}\n` +
    `💼 *Serviço:* ${serviceName}\n` +
    `👨‍💼 *Profissional:* ${professionalName}\n` +
    `\n✅ Agendamento confirmado automaticamente!`;
};
