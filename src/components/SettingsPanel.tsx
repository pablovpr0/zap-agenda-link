import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Save, Loader2, RefreshCw } from 'lucide-react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useRealTimeSync } from '@/hooks/useRealTimeSync';
import { useToast } from '@/hooks/use-toast';
import GeneralSettings from './settings/GeneralSettings';
import ScheduleSettings from './settings/ScheduleSettings';
import { usePublicThemeCustomizer } from '@/hooks/usePublicThemeCustomizer';
const SettingsPanel = () => {
  const {
    toast
  } = useToast();
  const {
    loading,
    saving,
    generalSettings,
    setGeneralSettings,
    saveSettings,
    refreshSettings
  } = useCompanySettings();
  const {
    saveSettings: saveThemeSettings
  } = usePublicThemeCustomizer();

  // Real-time sync callbacks
  const handleSettingsSync = useCallback(() => {
    console.log('🔄 Settings synced from real-time update');
    refreshSettings?.();
    toast({
      title: "Configurações atualizadas",
      description: "As configurações foram sincronizadas automaticamente."
    });
  }, [refreshSettings, toast]);
  const handleScheduleSync = useCallback(() => {
    console.log('🔄 Schedule synced from real-time update');
    // Trigger schedule refresh if needed
  }, []);
  const handleCompanyDataSync = useCallback(() => {
    console.log('🔄 Company data synced from real-time update');
    refreshSettings?.();
  }, [refreshSettings]);

  // Setup real-time sync
  const {
    triggerSync
  } = useRealTimeSync({
    onSettingsChange: handleSettingsSync,
    onScheduleChange: handleScheduleSync,
    onCompanyDataChange: handleCompanyDataSync
  });
  if (loading) {
    return <div className="p-3 md:p-6 space-y-4 md:space-y-6 fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-whatsapp-green mx-auto mb-4" />
            <p className="text-gray-600">Carregando configurações...</p>
          </div>
        </div>
      </div>;
  }
  return <div className="p-3 md:p-6 space-y-4 md:space-y-6 fade-in max-w-6xl mx-auto">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Settings className="w-5 md:w-6 h-5 md:h-6 text-whatsapp-green" />
              Configurações
            </h2>
            <p className="text-whatsapp-muted text-sm">
              Gerencie as configurações do seu negócio
              
            </p>
            
          </div>
          
          <Button variant="outline" size="sm" onClick={triggerSync} className="border-whatsapp-green text-whatsapp-green hover:bg-green-50">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sincronizar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <div className="overflow-x-auto pb-2">
          <TabsList className="grid w-full grid-cols-2 min-w-[300px] md:min-w-0 bg-gray-100 h-auto">
            <TabsTrigger value="general" className="text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:text-whatsapp-green px-3 py-2">
              ⚙️ Configurações Gerais
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:text-whatsapp-green px-3 py-2">
              ⏰ Horários de Funcionamento
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className="space-y-4">
          
          
          <GeneralSettings settings={generalSettings} onSettingsChange={setGeneralSettings} />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          
          
          <ScheduleSettings onScheduleUpdate={() => {
          // Callback quando os horários são atualizados
          console.log('Horários atualizados com sucesso');
        }} />
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="text-center pt-4 space-y-3">
        <Button onClick={saveSettings} size="lg" disabled={saving} className="bg-whatsapp-green hover:bg-green-600 text-white disabled:opacity-50">
          {saving ? <>
              <Loader2 className="w-4 md:w-5 h-4 md:h-5 mr-2 animate-spin" />
              Salvando e Sincronizando...
            </> : <>
              <Save className="w-4 md:w-5 h-4 md:h-5 mr-2" />
              Salvar Configurações
            </>}
        </Button>
        
        
      </div>
    </div>;
};
export default SettingsPanel;