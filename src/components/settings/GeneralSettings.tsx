
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock } from 'lucide-react';

interface GeneralSettingsData {
  maxSimultaneousBookings: number;
  agendaTimeLimit: number;
  timeInterval: number;
}

interface GeneralSettingsProps {
  settings: GeneralSettingsData;
  onSettingsChange: (settings: GeneralSettingsData) => void;
}

const GeneralSettings = ({ settings, onSettingsChange }: GeneralSettingsProps) => {
  const updateSettings = (key: keyof GeneralSettingsData, value: number) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
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
              value={settings.maxSimultaneousBookings.toString()}
              onValueChange={(value) => updateSettings('maxSimultaneousBookings', parseInt(value))}
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
              value={settings.agendaTimeLimit.toString()}
              onValueChange={(value) => updateSettings('agendaTimeLimit', parseInt(value))}
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
            value={settings.timeInterval.toString()}
            onValueChange={(value) => updateSettings('timeInterval', parseInt(value))}
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
  );
};

export default GeneralSettings;
