
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Settings, Clock, MapPin, Users, HelpCircle, Palette, Camera, Upload, Instagram } from 'lucide-react';
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
      monday: { active: true, start: '09:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
      tuesday: { active: true, start: '09:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
      wednesday: { active: true, start: '09:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
      thursday: { active: true, start: '09:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
      friday: { active: true, start: '09:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
      saturday: { active: true, start: '09:00', end: '16:00', lunchStart: '', lunchEnd: '' },
      sunday: { active: false, start: '09:00', end: '18:00', lunchStart: '', lunchEnd: '' }
    }
  });

  const [clientAreaCustomization, setClientAreaCustomization] = useState({
    logo: null,
    coverImage: null,
    themeColor: '#25D366',
    companyName: 'Salão Beleza & Estilo'
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
    thursday: 'Thursday',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 fade-in">
      <div className="mb-6 md:mb-8">
        <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Settings className="w-5 md:w-6 h-5 md:h-6 text-whatsapp-green" />
          Configurações
        </h2>
        <p className="text-whatsapp-muted text-sm">Gerencie as configurações do seu negócio</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 min-w-[600px] md:min-w-0 bg-gray-100">
            <TabsTrigger value="general" className="text-xs md:text-sm data-[state=active]:bg-white">Geral</TabsTrigger>
            <TabsTrigger value="company" className="text-xs md:text-sm data-[state=active]:bg-white">Dados Básicos</TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs md:text-sm data-[state=active]:bg-white">Horários</TabsTrigger>
            <TabsTrigger value="client-area" className="text-xs md:text-sm data-[state=active]:bg-white">Área Cliente</TabsTrigger>
            <TabsTrigger value="management" className="text-xs md:text-sm data-[state=active]:bg-white">Cadastros</TabsTrigger>
            <TabsTrigger value="support" className="text-xs md:text-sm data-[state=active]:bg-white">Suporte</TabsTrigger>
          </TabsList>
        </div>

        {/* Configurações Gerais */}
        <TabsContent value="general" className="space-y-4">
          <Card className="bg-white border-whatsapp">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg text-gray-800">
                <Clock className="w-4 md:w-5 h-4 md:h-5 text-whatsapp-green" />
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
                    <SelectTrigger className="border-whatsapp">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
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
                    <SelectTrigger className="border-whatsapp">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
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
                  <SelectTrigger className="max-w-xs border-whatsapp">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
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

        {/* Dados Básicos */}
        <TabsContent value="company" className="space-y-4">
          <Card className="bg-white border-whatsapp">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg text-gray-800">
                <MapPin className="w-4 md:w-5 h-4 md:h-5 text-whatsapp-green" />
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
                    className="border-whatsapp"
                  />
                </div>
                <div>
                  <Label htmlFor="company-phone">Telefone</Label>
                  <Input
                    id="company-phone"
                    value={companyData.phone}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, phone: e.target.value }))}
                    className="border-whatsapp"
                  />
                </div>
                <div>
                  <Label htmlFor="company-email">E-mail</Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={companyData.email}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                    className="border-whatsapp"
                  />
                </div>
                <div>
                  <Label htmlFor="instagram-url">Instagram</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-whatsapp bg-gray-50 text-whatsapp-muted text-sm">
                      <Instagram className="w-4 h-4" />
                    </span>
                    <Input
                      id="instagram-url"
                      value={companyData.instagramUrl}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, instagramUrl: e.target.value }))}
                      className="rounded-l-none border-whatsapp"
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
                  className="border-whatsapp"
                />
              </div>
              
              <div>
                <Label htmlFor="custom-url">URL Personalizada</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-whatsapp bg-gray-50 text-whatsapp-muted text-sm">
                    zapagenda.com/
                  </span>
                  <Input
                    id="custom-url"
                    value={companyData.customUrl}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, customUrl: e.target.value }))}
                    className="rounded-l-none border-whatsapp"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dias e Horários */}
        <TabsContent value="schedule" className="space-y-4">
          <Card className="bg-white border-whatsapp">
            <CardHeader>
              <CardTitle className="text-base md:text-lg text-gray-800">Dias e Horários de Funcionamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(companyData.workingDays).map(([day, config]) => (
                <div key={day} className="p-3 border border-whatsapp rounded-lg space-y-3">
                  <div className="flex items-center space-x-2">
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
                    <span className="text-sm font-medium text-gray-800">{dayNames[day as keyof typeof dayNames]}</span>
                  </div>
                  
                  {config.active && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs">Início</Label>
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
                          className="border-whatsapp text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Fim</Label>
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
                          className="border-whatsapp text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Almoço início</Label>
                        <Input
                          type="time"
                          value={config.lunchStart}
                          onChange={(e) => 
                            setCompanyData(prev => ({
                              ...prev,
                              workingDays: {
                                ...prev.workingDays,
                                [day]: { ...config, lunchStart: e.target.value }
                              }
                            }))
                          }
                          className="border-whatsapp text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Almoço fim</Label>
                        <Input
                          type="time"
                          value={config.lunchEnd}
                          onChange={(e) => 
                            setCompanyData(prev => ({
                              ...prev,
                              workingDays: {
                                ...prev.workingDays,
                                [day]: { ...config, lunchEnd: e.target.value }
                              }
                            }))
                          }
                          className="border-whatsapp text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Área do Cliente */}
        <TabsContent value="client-area" className="space-y-4">
          <Card className="bg-white border-whatsapp">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg text-gray-800">
                <Palette className="w-4 md:w-5 h-4 md:h-5 text-whatsapp-green" />
                Personalizar Área do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company-display-name">Nome da Empresa (exibição)</Label>
                <Input
                  id="company-display-name"
                  value={clientAreaCustomization.companyName}
                  onChange={(e) => setClientAreaCustomization(prev => ({ ...prev, companyName: e.target.value }))}
                  className="border-whatsapp"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Foto do Perfil</Label>
                  <div className="border-2 border-dashed border-whatsapp rounded-lg p-4 text-center">
                    <Camera className="w-8 h-8 text-whatsapp-muted mx-auto mb-2" />
                    <p className="text-sm text-whatsapp-muted mb-2">Clique para enviar foto do perfil</p>
                    <Button variant="outline" size="sm" className="border-whatsapp">
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Foto
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label>Foto de Capa</Label>
                  <div className="border-2 border-dashed border-whatsapp rounded-lg p-4 text-center">
                    <Camera className="w-8 h-8 text-whatsapp-muted mx-auto mb-2" />
                    <p className="text-sm text-whatsapp-muted mb-2">Clique para enviar foto de capa</p>
                    <Button variant="outline" size="sm" className="border-whatsapp">
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Capa
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="theme-color">Cor do Tema</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="theme-color"
                    type="color"
                    value={clientAreaCustomization.themeColor}
                    onChange={(e) => setClientAreaCustomization(prev => ({ ...prev, themeColor: e.target.value }))}
                    className="w-16 h-10 border-whatsapp"
                  />
                  <Input
                    value={clientAreaCustomization.themeColor}
                    onChange={(e) => setClientAreaCustomization(prev => ({ ...prev, themeColor: e.target.value }))}
                    className="flex-1 border-whatsapp"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cadastros */}
        <TabsContent value="management" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white border-whatsapp">
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 text-whatsapp-green mx-auto mb-2" />
                <h3 className="font-medium mb-1 text-gray-800">Clientes</h3>
                <p className="text-sm text-whatsapp-muted mb-3">Gerencie sua base de clientes</p>
                <Button variant="outline" size="sm" className="w-full border-whatsapp">
                  Gerenciar Clientes
                </Button>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white border-whatsapp">
              <CardContent className="p-4 text-center">
                <Settings className="w-8 h-8 text-whatsapp-green mx-auto mb-2" />
                <h3 className="font-medium mb-1 text-gray-800">Serviços</h3>
                <p className="text-sm text-whatsapp-muted mb-3">Configure seus serviços e preços</p>
                <Button variant="outline" size="sm" className="w-full border-whatsapp">
                  Gerenciar Serviços
                </Button>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white border-whatsapp">
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 text-whatsapp-green mx-auto mb-2" />
                <h3 className="font-medium mb-1 text-gray-800">Profissionais</h3>
                <p className="text-sm text-whatsapp-muted mb-3">Cadastre sua equipe</p>
                <Button variant="outline" size="sm" className="w-full border-whatsapp">
                  Gerenciar Equipe
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Suporte */}
        <TabsContent value="support" className="space-y-4">
          <Card className="bg-white border-whatsapp">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg text-gray-800">
                <HelpCircle className="w-4 md:w-5 h-4 md:h-5 text-whatsapp-green" />
                Suporte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium mb-2 text-gray-800">Precisa de ajuda?</h3>
                <p className="text-whatsapp-muted text-sm mb-4">Nossa equipe está pronta para ajudar você</p>
                
                <div className="space-y-3">
                  <Button variant="outline" className="w-full border-whatsapp">
                    📞 Contato por WhatsApp
                  </Button>
                  <Button variant="outline" className="w-full border-whatsapp">
                    📧 Enviar E-mail
                  </Button>
                  <Button variant="outline" className="w-full border-whatsapp">
                    📚 Central de Ajuda
                  </Button>
                </div>
              </div>
              
              <div className="border-t pt-4 text-center border-whatsapp">
                <p className="text-xs text-whatsapp-muted">
                  ZapAgenda v1.0 - © 2024
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="text-center pt-4">
        <Button onClick={handleSave} size="lg" className="bg-whatsapp-green hover:bg-green-600 text-white">
          <Save className="w-4 md:w-5 h-4 md:h-5 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default SettingsPanel;
