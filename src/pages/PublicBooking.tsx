import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Clock, User, Phone, Mail, MessageCircle, Calendar, Star } from 'lucide-react';
import { format, addDays, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PublicCalendar from '@/components/PublicCalendar';

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

const PublicBooking = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  const { toast } = useToast();
  
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (companySlug) {
      loadCompanyData();
    }
  }, [companySlug]);

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

  const generateAvailableTimes = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      console.log('Dados do agendamento:', {
        selectedService,
        selectedDate,
        selectedTime,
        clientName,
        clientPhone,
        clientEmail,
        notes
      });

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
        return;
      }

      // Criar agendamento com dados consistentes
      const appointmentData = {
        company_id: companySettings!.company_id,
        client_id: clientId,
        service_id: selectedService,
        appointment_date: selectedDate, // Usar exatamente a data selecionada
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

      // Limpar formulário
      setSelectedService('');
      setSelectedDate('');
      setSelectedTime('');
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setNotes('');

    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">ZapAgenda</div>
          <div className="text-gray-600">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!companySettings || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-red-600">Empresa não encontrada</div>
          <div className="text-gray-600">Verifique se o link está correto.</div>
        </div>
      </div>
    );
  }

  const availableDates = generateAvailableDates();
  const availableTimes = generateAvailableTimes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header estilo WhatsApp Business */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="text-center">
            {/* Foto de perfil grande e redonda */}
            {(companySettings?.logo_url || profile?.profile_image_url) && (
              <div className="mb-4">
                <img
                  src={companySettings.logo_url || profile.profile_image_url}
                  alt={profile?.company_name || 'Logo'}
                  className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-green-500 shadow-lg"
                />
              </div>
            )}
            
            {/* Nome da empresa com fonte grande */}
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {profile?.company_name || 'Empresa'}
            </h1>
            
            {/* Tipo de negócio */}
            <p className="text-green-600 font-medium mb-2 flex items-center justify-center gap-1">
              <Star className="w-4 h-4" />
              {profile?.business_type || 'Serviços'}
            </p>

            {/* Mensagem de boas-vindas */}
            {companySettings?.welcome_message && (
              <p className="text-gray-600 text-sm mb-4 italic">
                "{companySettings.welcome_message}"
              </p>
            )}

            {/* Endereço */}
            {companySettings?.address && (
              <div className="flex items-center justify-center gap-2 text-gray-600 text-sm mb-4">
                <MapPin className="w-4 h-4 text-green-500" />
                <span>{companySettings.address}</span>
              </div>
            )}

            {/* Chamada para ação */}
            <div className="bg-green-500 text-white py-3 px-6 rounded-full font-semibold text-lg shadow-md">
              <MessageCircle className="w-5 h-5 inline mr-2" />
              Agende seu horário
            </div>
          </div>
        </div>

        {/* Formulário de agendamento */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Serviço */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Escolha o serviço</Label>
                <Select value={selectedService} onValueChange={setSelectedService} required>
                  <SelectTrigger className="border-green-200 focus:border-green-400 focus:ring-green-100 bg-green-50">
                    <SelectValue placeholder="Qual serviço você deseja?" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id} className="hover:bg-green-50">
                        <div className="flex justify-between items-center w-full">
                          <span className="font-medium">{service.name}</span>
                          <div className="flex items-center gap-2 text-sm text-gray-600 ml-4">
                            <Clock className="w-3 h-3" />
                            {service.duration}min
                            {service.price && (
                              <span className="font-medium text-green-600">
                                R$ {service.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Calendário */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-500" />
                  Escolha a data
                </Label>
                <PublicCalendar
                  availableDates={availableDates}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                />
              </div>

              {/* Horário */}
              {selectedDate && (
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Escolha o horário</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`
                          p-3 text-sm rounded-lg border transition-all duration-200
                          ${selectedTime === time 
                            ? 'bg-green-500 text-white border-green-500 shadow-md' 
                            : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                          }
                        `}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dados do cliente */}
              <div className="space-y-4">
                <Label className="text-gray-700 font-medium">Seus dados</Label>
                
                <div className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="pl-10 border-green-200 focus:border-green-400 focus:ring-green-100 bg-green-50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="pl-10 border-green-200 focus:border-green-400 focus:ring-green-100 bg-green-50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="seu@email.com (opcional)"
                      className="pl-10 border-green-200 focus:border-green-400 focus:ring-green-100 bg-green-50"
                    />
                  </div>
                </div>

                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Alguma observação especial? (opcional)"
                  rows={3}
                  className="border-green-200 focus:border-green-400 focus:ring-green-100 bg-green-50"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 text-lg font-semibold rounded-xl shadow-lg"
                disabled={submitting}
              >
                {submitting ? (
                  "Agendando..."
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Confirmar Agendamento
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Links sociais */}
        {companySettings?.instagram_url && (
          <div className="text-center mt-6">
            <Button variant="outline" asChild className="border-green-200 text-green-600 hover:bg-green-50">
              <a 
                href={companySettings.instagram_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                📱 Siga no Instagram
              </a>
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-400">
          Powered by ZapAgenda
        </div>
      </div>
    </div>
  );
};

export default PublicBooking;
