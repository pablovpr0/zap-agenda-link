
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import GeneralSettings from './settings/GeneralSettings';
import CompanyDataSettings from './settings/CompanyDataSettings';
import ScheduleSettings from './settings/ScheduleSettings';
import ClientAreaSettings from './settings/ClientAreaSettings';
import ManagementSection from './settings/ManagementSection';
import SupportSection from './settings/SupportSection';

const SettingsPanel = () => {
  const [generalSettings, setGeneralSettings] = useState({
    maxSimultaneousBookings: 3,
    agendaTimeLimit: 30,
    timeInterval: 30
  });

  const [companyBasicData, setCompanyBasicData] = useState({
    name: 'Salão Beleza & Estilo',
    address: 'Rua das Flores, 123 - Centro',
    phone: '(11) 99999-9999',
    email: 'contato@belezaestilo.com',
    instagramUrl: '@belezaestilo',
    customUrl: 'beleza-estilo'
  });

  const [workingDays, setWorkingDays] = useState({
    monday: { active: true, start: '09:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
    tuesday: { active: true, start: '09:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
    wednesday: { active: true, start: '09:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
    thursday: { active: true, start: '09:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
    friday: { active: true, start: '09:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
    saturday: { active: true, start: '09:00', end: '16:00', lunchStart: '', lunchEnd: '' },
    sunday: { active: false, start: '09:00', end: '18:00', lunchStart: '', lunchEnd: '' }
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

        <TabsContent value="general" className="space-y-4">
          <GeneralSettings 
            settings={generalSettings} 
            onSettingsChange={setGeneralSettings} 
          />
        </TabsContent>

        <TabsContent value="company" className="space-y-4">
          <CompanyDataSettings 
            data={companyBasicData} 
            onDataChange={setCompanyBasicData} 
          />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <ScheduleSettings 
            workingDays={workingDays} 
            onWorkingDaysChange={setWorkingDays} 
          />
        </TabsContent>

        <TabsContent value="client-area" className="space-y-4">
          <ClientAreaSettings 
            customization={clientAreaCustomization} 
            onCustomizationChange={setClientAreaCustomization} 
          />
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <ManagementSection />
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <SupportSection />
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
