
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Settings, Clock, DollarSign, MapPin, Users, BarChart3, HelpCircle, Instagram, Palette, Camera, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const SettingsPanel = () => {
  const [generalSettings, setGeneralSettings] = useState({
    maxSimultaneousBookings: 3,
    agendaTimeLimit: 30,
    timeInterval: 30
  });

  const [companyData, setCompanyData] = useState({
    name: 'Salão Beleza & Estilo',
    address: 'Rua das Flores, 123 - Centro',
    phone: '(11) 99999-9999',
    email: 'contato@belezaestilo.com',
    description: 'Salão de beleza especializado em cortes, coloração e tratamentos capilares.',
    instagramUrl: '@belezaestilo',
    customUrl: 'beleza-estilo',
    workingDays: {
      monday: { active: true, start: '09:00', end: '18:00' },
      tuesday: { active: true, start: '09:00', end: '18:00' },
      wednesday: { active: true, start: '09:00', end: '18:00' },
      thursday: { active: true, start: '09:00', end: '18:00' },
      friday: { active: true, start: '09:00', end: '18:00' },
      saturday: { active: true, start: '09:00', end: '16:00' },
      sunday: { active: false, start: '09:00', end: '18:00' }
    }
  });

  const [clientAreaCustomization, setClientAreaCustomization] = useState({
    logo: null,
    coverImage: null,
    themeColor: '#22c55e',
    subtitle: 'Seu momento de beleza e bem-estar'
  });

  const handleSave = () => {
    toast({
      title: "Configurações salvas!",
      description: "Todas as alterações foram salvas com sucesso.",
    });
  };

  const dayNames = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 fade-in">
      <div className="mb-6 md:mb-8">
        <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Settings className="w-5 md:w-6 h-5 md:h-6 text-primary" />
          Configurações
        </h2>
        <p className="text-gray-600 text-sm">Gerencie as configurações do seu negócio</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 min-w-[600px] md:min-w-0">
            <TabsTrigger value="general" className="text-xs md:text-sm">Geral</TabsTrigger>
            <TabsTrigger value="company" className="text-xs md:text-sm">Empresa</TabsTrigger>
            <TabsTrigger value="client-area" className="text-xs md:text-sm">Área Cliente</TabsTrigger>
            <TabsTrigger value="registration" className="text-xs md:text-sm">Cadastros</TabsTrigger>
            <TabsTrigger value="management" className="text-xs md:text-sm">Gestão</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs md:text-sm">Relatórios</TabsTrigger>
            <TabsTrigger value="support" className="text-xs md:text-sm">Suporte</TabsTrigger>
          </TabsList>
        </div>

        {/* Geral */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Clock className="w-4 md:w-5 h-4 md:h-5 text-primary" />
                Configurações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max-bookings">Limite de agendamentos simultâneos por cliente</Label>
                  <Select
                    value={generalSettings.maxSimultaneousBookings.toString()}
                    onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, maxSimultaneousBookings: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 agendamento</SelectItem>
                      <SelectItem value="2">2 agendamentos</SelectItem>
                      <SelectItem value="3">3 agendamentos</SelectItem>
                      <SelectItem value="5">5 agendamentos</SelectItem>
                      <SelectItem value="10">10 agendamentos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="agenda-limit">Limite de tempo da agenda (dias)</Label>
                  <Select
                    value={generalSettings.agendaTimeLimit.toString()}
                    onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, agendaTimeLimit: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="15">15 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="60">60 dias</SelectItem>
                      <SelectItem value="90">90 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="time-interval">Intervalos de horários (minutos)</Label>
                <Select
                  value={generalSettings.timeInterval.toString()}
                  onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, timeInterval: parseInt(value) }))}
                >
                  <SelectTrigger className="max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">60 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Empresa */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <MapPin className="w-4 md:w-5 h-4 md:h-5 text-primary" />
                Dados Básicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input
                    id="company-name"
                    value={companyData.name}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="company-phone">Telefone</Label>
                  <Input
                    id="company-phone"
                    value={companyData.phone}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="company-email">E-mail</Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={companyData.email}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="instagram-url">Instagram</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      <Instagram className="w-4 h-4" />
                    </span>
                    <Input
                      id="instagram-url"
                      value={companyData.instagramUrl}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, instagramUrl: e.target.value }))}
                      className="rounded-l-none"
                      placeholder="@seuusuario"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="company-address">Endereço</Label>
                <Input
                  id="company-address"
                  value={companyData.address}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="custom-url">URL Personalizada</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    zapagenda.com/
                  </span>
                  <Input
                    id="custom-url"
                    value={companyData.customUrl}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, customUrl: e.target.value }))}
                    className="rounded-l-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Horários de Funcionamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Dias e Horários de Funcionamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(companyData.workingDays).map(([day, config]) => (
                <div key={day} className="flex flex-col md:flex-row md:items-center gap-3 p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 min-w-0 md:min-w-[140px]">
                    <Switch
                      checked={config.active}
                      onCheckedChange={(checked) => 
                        setCompanyData(prev => ({
                          ...prev,
                          workingDays: {
                            ...prev.workingDays,
                            [day]: { ...config, active: checked }
                          }
                        }))
                      }
                    />
                    <span className="text-sm font-medium truncate">{dayNames[day as keyof typeof dayNames]}</span>
                  </div>
                  
                  {config.active && (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="time"
                        value={config.start}
                        onChange={(e) => 
                          setCompanyData(prev => ({
                            ...prev,
                            workingDays: {
                              ...prev.workingDays,
                              [day]: { ...config, start: e.target.value }
                            }
                          }))
                        }
                        className="w-full md:w-auto"
                      />
                      <span className="text-gray-500 text-sm">às</span>
                      <Input
                        type="time"
                        value={config.end}
                        onChange={(e) => 
                          setCompanyData(prev => ({
                            ...prev,
                            workingDays: {
                              ...prev.workingDays,
                              [day]: { ...config, end: e.target.value }
                            }
                          }))
                        }
                        className="w-full md:w-auto"
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Área do Cliente */}
        <TabsContent value="client-area" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Palette className="w-4 md:w-5 h-4 md:h-5 text-primary" />
                Personalizar Área do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Logo da Empresa</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Clique para enviar logo</p>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Logo
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label>Imagem de Capa</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Clique para enviar capa</p>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Capa
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="theme-color">Cor do Tema</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="theme-color"
                      type="color"
                      value={clientAreaCustomization.themeColor}
                      onChange={(e) => setClientAreaCustomization(prev => ({ ...prev, themeColor: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={clientAreaCustomization.themeColor}
                      onChange={(e) => setClientAreaCustomization(prev => ({ ...prev, themeColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="subtitle">Texto sob o nome</Label>
                  <Input
                    id="subtitle"
                    value={clientAreaCustomization.subtitle}
                    onChange={(e) => setClientAreaCustomization(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Ex: Seu momento de beleza e bem-estar"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cadastros */}
        <TabsContent value="registration" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-medium mb-1">Clientes</h3>
                <p className="text-sm text-gray-600 mb-3">Gerencie sua base de clientes</p>
                <Button variant="outline" size="sm" className="w-full">
                  Gerenciar Clientes
                </Button>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-medium mb-1">Serviços</h3>
                <p className="text-sm text-gray-600 mb-3">Configure seus serviços e preços</p>
                <Button variant="outline" size="sm" className="w-full">
                  Gerenciar Serviços
                </Button>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-medium mb-1">Profissionais</h3>
                <p className="text-sm text-gray-600 mb-3">Cadastre sua equipe</p>
                <Button variant="outline" size="sm" className="w-full">
                  Gerenciar Equipe
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Gestão */}
        <TabsContent value="management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <BarChart3 className="w-4 md:w-5 h-4 md:h-5 text-primary" />
                Gestão do Negócio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">Ferramentas de gestão estarão disponíveis em breve</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" disabled>Fluxo de Caixa</Button>
                <Button variant="outline" disabled>Comissões</Button>
                <Button variant="outline" disabled>Estoque</Button>
                <Button variant="outline" disabled>Marketing</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatórios */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <BarChart3 className="w-4 md:w-5 h-4 md:h-5 text-primary" />
                Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">Relatórios detalhados estarão disponíveis em breve</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" disabled>Relatório de Vendas</Button>
                <Button variant="outline" disabled>Relatório de Clientes</Button>
                <Button variant="outline" disabled>Relatório Financeiro</Button>
                <Button variant="outline" disabled>Relatório de Serviços</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suporte */}
        <TabsContent value="support" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <HelpCircle className="w-4 md:w-5 h-4 md:h-5 text-primary" />
                Suporte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium mb-2">Precisa de ajuda?</h3>
                <p className="text-gray-600 text-sm mb-4">Nossa equipe está pronta para ajudar você</p>
                
                <div className="space-y-3">
                  <Button variant="outline" className="w-full">
                    📞 Contato por WhatsApp
                  </Button>
                  <Button variant="outline" className="w-full">
                    📧 Enviar E-mail
                  </Button>
                  <Button variant="outline" className="w-full">
                    📚 Central de Ajuda
                  </Button>
                </div>
              </div>
              
              <div className="border-t pt-4 text-center">
                <p className="text-xs text-gray-500">
                  ZapAgenda v1.0 - © 2024
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="text-center pt-4">
        <Button onClick={handleSave} size="lg" className="bg-primary hover:bg-primary/90">
          <Save className="w-4 md:w-5 h-4 md:h-5 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default SettingsPanel;
