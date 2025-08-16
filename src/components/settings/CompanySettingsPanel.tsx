import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Calendar, 
  Users, 
  Settings, 
  Save, 
  RefreshCw,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { useCompanySettingsRealtime } from '@/hooks/useCompanySettingsRealtime';
import { CompanySettings } from '@/services/companySettingsService';

interface CompanySettingsPanelProps {
  companyId: string;
}

const DAYS_OF_WEEK = [
  { key: 'mon', label: 'Segunda-feira' },
  { key: 'tue', label: 'Terça-feira' },
  { key: 'wed', label: 'Quarta-feira' },
  { key: 'thu', label: 'Quinta-feira' },
  { key: 'fri', label: 'Sexta-feira' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' }
];

const CompanySettingsPanel: React.FC<CompanySettingsPanelProps> = ({ companyId }) => {
  const {
    settings,
    isLoading,
    isUpdating,
    error,
    updateSettings,
    refreshSettings,
    lastUpdated
  } = useCompanySettingsRealtime(companyId);

  const [localSettings, setLocalSettings] = useState<Partial<CompanySettings>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Sincronizar configurações locais quando as configurações remotas mudarem
  React.useEffect(() => {
    if (settings && !hasChanges) {
      setLocalSettings(settings);
    }
  }, [settings, hasChanges]);

  const handleInputChange = (field: keyof CompanySettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleOpeningHoursChange = (day: string, field: 'open' | 'close' | 'active', value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours?.[day],
          [field]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const handleLunchBreakChange = (field: 'start' | 'end' | 'active', value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      lunch_break: {
        ...prev.lunch_break,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const success = await updateSettings(localSettings);
    if (success) {
      setHasChanges(false);
    }
  };

  const handleRefresh = async () => {
    await refreshSettings();
    setLocalSettings(settings || {});
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Carregando configurações...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
          <span className="text-red-600">{error}</span>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="ml-4">
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurações de Agendamento
            </CardTitle>
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-sm text-gray-500">
                  Última atualização: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Configurações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max_bookings">Máximo de agendamentos por cliente</Label>
              <Input
                id="max_bookings"
                type="number"
                min="1"
                max="10"
                value={localSettings.max_bookings_per_client || 3}
                onChange={(e) => handleInputChange('max_bookings_per_client', parseInt(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="slot_interval">Intervalo entre horários (minutos)</Label>
              <Input
                id="slot_interval"
                type="number"
                min="15"
                max="120"
                step="15"
                value={localSettings.slot_interval_minutes || 30}
                onChange={(e) => handleInputChange('slot_interval_minutes', parseInt(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="booking_days_limit">Limite de dias para agendamento</Label>
              <Input
                id="booking_days_limit"
                type="number"
                min="1"
                max="365"
                value={localSettings.booking_days_limit || 30}
                onChange={(e) => handleInputChange('booking_days_limit', parseInt(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="advance_booking_limit">Antecedência máxima (dias)</Label>
              <Input
                id="advance_booking_limit"
                type="number"
                min="1"
                max="365"
                value={localSettings.advance_booking_limit || 60}
                onChange={(e) => handleInputChange('advance_booking_limit', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="same_day_booking">Permitir agendamento no mesmo dia</Label>
              <Switch
                id="same_day_booking"
                checked={localSettings.same_day_booking ?? true}
                onCheckedChange={(checked) => handleInputChange('same_day_booking', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="auto_confirm">Confirmar agendamentos automaticamente</Label>
              <Switch
                id="auto_confirm"
                checked={localSettings.auto_confirm_bookings ?? true}
                onCheckedChange={(checked) => handleInputChange('auto_confirm_bookings', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="require_email">Exigir email do cliente</Label>
              <Switch
                id="require_email"
                checked={localSettings.require_client_email ?? false}
                onCheckedChange={(checked) => handleInputChange('require_client_email', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horários de Funcionamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horários de Funcionamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS_OF_WEEK.map((day) => {
            const daySettings = localSettings.opening_hours?.[day.key];
            return (
              <div key={day.key} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="w-32">
                  <Switch
                    checked={daySettings?.active ?? true}
                    onCheckedChange={(checked) => handleOpeningHoursChange(day.key, 'active', checked)}
                  />
                  <Label className="ml-2">{day.label}</Label>
                </div>
                
                {daySettings?.active && (
                  <>
                    <div>
                      <Label className="text-xs">Abertura</Label>
                      <Input
                        type="time"
                        value={daySettings?.open || '08:00'}
                        onChange={(e) => handleOpeningHoursChange(day.key, 'open', e.target.value)}
                        className="w-24"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">Fechamento</Label>
                      <Input
                        type="time"
                        value={daySettings?.close || '18:00'}
                        onChange={(e) => handleOpeningHoursChange(day.key, 'close', e.target.value)}
                        className="w-24"
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Horário de Almoço */}
      <Card>
        <CardHeader>
          <CardTitle>Horário de Almoço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Ativar pausa para almoço</Label>
            <Switch
              checked={localSettings.lunch_break?.active ?? true}
              onCheckedChange={(checked) => handleLunchBreakChange('active', checked)}
            />
          </div>
          
          {localSettings.lunch_break?.active && (
            <div className="flex gap-4">
              <div>
                <Label>Início</Label>
                <Input
                  type="time"
                  value={localSettings.lunch_break?.start || '12:00'}
                  onChange={(e) => handleLunchBreakChange('start', e.target.value)}
                />
              </div>
              
              <div>
                <Label>Fim</Label>
                <Input
                  type="time"
                  value={localSettings.lunch_break?.end || '13:00'}
                  onChange={(e) => handleLunchBreakChange('end', e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mensagens */}
      <Card>
        <CardHeader>
          <CardTitle>Mensagens Personalizadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="confirmation_message">Mensagem de confirmação</Label>
            <Textarea
              id="confirmation_message"
              value={localSettings.booking_confirmation_message || ''}
              onChange={(e) => handleInputChange('booking_confirmation_message', e.target.value)}
              placeholder="Seu agendamento foi confirmado!"
            />
          </div>
          
          <div>
            <Label htmlFor="cancellation_policy">Política de cancelamento</Label>
            <Textarea
              id="cancellation_policy"
              value={localSettings.cancellation_policy || ''}
              onChange={(e) => handleInputChange('cancellation_policy', e.target.value)}
              placeholder="Cancelamentos devem ser feitos com 24h de antecedência."
            />
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            {hasChanges ? (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Alterações não salvas</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Configurações salvas</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={isUpdating}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Recarregar
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isUpdating}
            >
              {isUpdating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanySettingsPanel;