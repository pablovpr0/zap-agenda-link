import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Save, Loader2 } from 'lucide-react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import GeneralSettings from './settings/GeneralSettings';
import CompanyDataSettings from './settings/CompanyDataSettings';
import ScheduleSettings from './settings/ScheduleSettings';
import ClientAreaSettings from './settings/ClientAreaSettings';
import SlugSettings from './settings/SlugSettings';
import ManagementSection from './settings/ManagementSection';
import SupportSection from './settings/SupportSection';

const SettingsPanel = () => {
  const {
    loading,
    saving,
    generalSettings,
    companyBasicData,
    workingDays,
    currentSlug,
    setGeneralSettings,
    setCompanyBasicData,
    setWorkingDays,
    setCurrentSlug,
    saveSettings
  } = useCompanySettings();

  const [clientAreaCustomization, setClientAreaCustomization] = useState({
    logo: null,
    coverImage: null,
    themeColor: '#25D366',
    companyName: 'Salão Beleza & Estilo',
    isDarkMode: false,
    selectedTheme: 'classic-green'
  });

  const handleSlugUpdate = (newSlug: string) => {
    setCurrentSlug(newSlug);
    setCompanyBasicData(prev => ({ ...prev, customUrl: newSlug }));
  };

  if (loading) {
    return (
      <div className="p-3 md:p-6 space-y-4 md:space-y-6 fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-whatsapp-green mx-auto mb-4" />
            <p className="text-gray-600">Carregando configurações...</p>
          </div>
        </div>
      </div>
    );
  }

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
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 min-w-[700px] md:min-w-0 bg-gray-100">
            <TabsTrigger value="general" className="text-xs md:text-sm data-[state=active]:bg-white">Geral</TabsTrigger>
            <TabsTrigger value="company" className="text-xs md:text-sm data-[state=active]:bg-white">Dados Básicos</TabsTrigger>
            <TabsTrigger value="slug" className="text-xs md:text-sm data-[state=active]:bg-white">Link Personalizado</TabsTrigger>
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

        <TabsContent value="slug" className="space-y-4">
          <SlugSettings 
            currentSlug={currentSlug}
            onSlugUpdate={handleSlugUpdate}
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
        <Button 
          onClick={saveSettings} 
          size="lg" 
          disabled={saving}
          className="bg-whatsapp-green hover:bg-green-600 text-white disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 md:w-5 h-4 md:h-5 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 md:w-5 h-4 md:h-5 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPanel;
