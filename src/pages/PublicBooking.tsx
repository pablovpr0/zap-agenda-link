
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
import { Calendar, Clock, User, Phone, Mail, MessageCircle } from 'lucide-react';
import { format, addDays, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CompanySettings {
  id: string;
  company_id: string;
  slug: string;
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
      // Criar ou buscar cliente
      let clientId;
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', companySettings!.company_id)
        .eq('phone', clientPhone)
        .single();

      if (existingClient) {
        clientId = existingClient.id;
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

        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      // Buscar duração do serviço
      const service = services.find(s => s.id === selectedService);
      
      // Criar agendamento
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          company_id: companySettings!.company_id,
          client_id: clientId,
          service_id: selectedService,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          duration: service?.duration || 60,
          status: 'confirmed',
          notes: notes || null,
        });

      if (appointmentError) throw appointmentError;

      // Gerar mensagem WhatsApp
      const whatsappMessage = `Olá! Acabei de agendar um horário:\n\n` +
        `📅 Data: ${format(new Date(selectedDate), 'dd/MM/yyyy', { locale: ptBR })}\n` +
        `⏰ Horário: ${selectedTime}\n` +
        `💇 Serviço: ${service?.name}\n` +
        `👤 Cliente: ${clientName}\n` +
        `📱 Telefone: ${clientPhone}${clientEmail ? `\n📧 Email: ${clientEmail}` : ''}${notes ? `\n📝 Observações: ${notes}` : ''}\n\n` +
        `Agendamento confirmado! ✅`;

      // Redirecionar para WhatsApp
      const whatsappUrl = `https://wa.me/55${clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(whatsappUrl, '_blank');

      toast({
        title: "Agendamento realizado!",
        description: "Seu agendamento foi confirmado. Você receberá uma confirmação no WhatsApp.",
      });

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
    <div className="min-h-screen bg-gray-50" style={{ backgroundColor: companySettings.theme_color + '10' }}>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header da empresa */}
        <div className="text-center mb-8">
          {(companySettings.logo_url || profile.profile_image_url) && (
            <img
              src={companySettings.logo_url || profile.profile_image_url}
              alt={profile.company_name}
              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4"
              style={{ borderColor: companySettings.theme_color }}
            />
          )}
          <h1 className="text-3xl font-bold mb-2" style={{ color: companySettings.theme_color }}>
            {profile.company_name}
          </h1>
          <p className="text-gray-600 mb-2">{profile.business_type}</p>
          {companySettings.welcome_message && (
            <p className="text-gray-700 italic">{companySettings.welcome_message}</p>
          )}
        </div>

        {/* Imagem de capa */}
        {companySettings.cover_image_url && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={companySettings.cover_image_url}
              alt="Capa"
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Formulário de agendamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" style={{ color: companySettings.theme_color }} />
              Agendar Horário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Serviço */}
              <div className="space-y-2">
                <Label htmlFor="service">Serviço *</Label>
                <Select value={selectedService} onValueChange={setSelectedService} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex justify-between items-center w-full">
                          <span>{service.name}</span>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-3 h-3" />
                            {service.duration}min
                            {service.price && (
                              <span className="font-medium">
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

              {/* Data */}
              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Select value={selectedDate} onValueChange={setSelectedDate} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma data" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDates.map((date) => (
                      <SelectItem key={date.toISOString()} value={format(date, 'yyyy-MM-dd')}>
                        {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Horário */}
              {selectedDate && (
                <div className="space-y-2">
                  <Label htmlFor="time">Horário *</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimes.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Dados do cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail (opcional)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Alguma observação especial?"
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                style={{ backgroundColor: companySettings.theme_color }}
                disabled={submitting}
              >
                {submitting ? (
                  "Agendando..."
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Agendar via WhatsApp
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Links sociais */}
        {companySettings.instagram_url && (
          <div className="text-center mt-6">
            <Button variant="outline" asChild>
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
        <div className="text-center mt-8 text-sm text-gray-500">
          Powered by ZapAgenda
        </div>
      </div>
    </div>
  );
};

export default PublicBooking;
