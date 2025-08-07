import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, Coffee, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
interface DaySchedule {
  day_of_week: number;
  is_active: boolean;
  start_time: string;
  end_time: string;
  lunch_start?: string;
  lunch_end?: string;
  has_lunch_break: boolean;
}
interface ScheduleSettingsProps {
  onScheduleUpdate?: () => void;
}
const ScheduleSettings = ({
  onScheduleUpdate
}: ScheduleSettingsProps) => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  console.log('🕐 ScheduleSettings: Component rendered', {
    user: user?.id,
    loading,
    schedulesCount: schedules.length,
    hasError: !!error
  });
  const dayNames = {
    1: 'Segunda-feira',
    2: 'Terça-feira',
    3: 'Quarta-feira',
    4: 'Quinta-feira',
    5: 'Sexta-feira',
    6: 'Sábado',
    0: 'Domingo'
  };
  const defaultSchedule: Omit<DaySchedule, 'day_of_week'> = {
    is_active: true,
    start_time: '09:00',
    end_time: '18:00',
    lunch_start: '12:00',
    lunch_end: '13:00',
    has_lunch_break: false
  };
  useEffect(() => {
    if (user) {
      loadSchedules();
    }
  }, [user]);
  const loadSchedules = async () => {
    setLoading(true);
    console.log('🔄 Loading schedules for user:', user?.id);
    try {
      // Since daily_schedules table exists but not in types, use direct query with any cast
      const {
        data,
        error
      } = await (supabase as any).from('daily_schedules').select('*').eq('company_id', user!.id).order('day_of_week');
      console.log('📋 Schedule query result:', {
        data,
        error,
        userID: user?.id
      });
      if (error) {
        console.error('❌ Error loading schedules:', error);
        throw error;
      }

      // Initialize all days if not exists
      const existingDays = data?.map(d => d.day_of_week) || [];
      const allDays = [0, 1, 2, 3, 4, 5, 6]; // Sunday to Saturday
      const completeSchedules: DaySchedule[] = [];
      for (const dayNum of allDays) {
        const existing = data?.find(d => d.day_of_week === dayNum);
        if (existing) {
          completeSchedules.push(existing);
        } else {
          completeSchedules.push({
            day_of_week: dayNum,
            ...defaultSchedule,
            is_active: dayNum >= 1 && dayNum <= 5 // Monday to Friday active by default
          });
        }
      }
      setSchedules(completeSchedules);
      console.log('✅ Schedules loaded successfully:', completeSchedules);
    } catch (error: any) {
      console.error('❌ Erro ao carregar horários:', error);
      setError(error.message || 'Erro desconhecido');
      toast({
        title: "Erro",
        description: "Não foi possível carregar os horários.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const updateSchedule = (dayOfWeek: number, updates: Partial<DaySchedule>) => {
    setSchedules(prev => prev.map(schedule => schedule.day_of_week === dayOfWeek ? {
      ...schedule,
      ...updates
    } : schedule));
    setHasChanges(true);
  };
  const saveSchedules = async () => {
    setSaving(true);
    try {
      // Delete existing schedules
      await (supabase as any).from('daily_schedules').delete().eq('company_id', user!.id);

      // Insert new schedules
      const schedulesToInsert = schedules.map(schedule => ({
        company_id: user!.id,
        day_of_week: schedule.day_of_week,
        is_active: schedule.is_active,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        lunch_start: schedule.has_lunch_break ? schedule.lunch_start : null,
        lunch_end: schedule.has_lunch_break ? schedule.lunch_end : null,
        has_lunch_break: schedule.has_lunch_break
      }));
      const {
        error
      } = await (supabase as any).from('daily_schedules').insert(schedulesToInsert);
      if (error) throw error;
      setHasChanges(false);
      toast({
        title: "Horários salvos!",
        description: "As configurações foram atualizadas com sucesso."
      });

      // Notify parent component
      if (onScheduleUpdate) {
        onScheduleUpdate();
      }
    } catch (error) {
      console.error('Erro ao salvar horários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar os horários.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  const copyToAllDays = (sourceDay: number) => {
    const sourceSchedule = schedules.find(s => s.day_of_week === sourceDay);
    if (!sourceSchedule) return;
    setSchedules(prev => prev.map(schedule => ({
      ...schedule,
      start_time: sourceSchedule.start_time,
      end_time: sourceSchedule.end_time,
      lunch_start: sourceSchedule.lunch_start,
      lunch_end: sourceSchedule.lunch_end,
      has_lunch_break: sourceSchedule.has_lunch_break
    })));
    setHasChanges(true);
    toast({
      title: "Horários copiados",
      description: "Os horários foram aplicados a todos os dias."
    });
  };

  // Debug: Always show component state
  console.log('🔍 ScheduleSettings render state:', {
    loading,
    error,
    userExists: !!user,
    schedulesLength: schedules.length
  });
  if (!user) {
    return <Card className="bg-white border-gray-200 shadow-lg">
        <CardHeader className="bg-red-50">
          <CardTitle className="text-base md:text-lg text-red-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-600" />
            ❌ Erro de Autenticação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 py-4">Usuário não autenticado. Faça login novamente.</p>
        </CardContent>
      </Card>;
  }
  if (error) {
    return <Card className="bg-white border-gray-200 shadow-lg">
        <CardHeader className="bg-red-50">
          <CardTitle className="text-base md:text-lg text-red-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-600" />
            ❌ Erro ao Carregar Horários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-4 space-y-2">
            <p className="text-red-600">Erro: {error}</p>
            <Button onClick={() => {
            setError(null);
            loadSchedules();
          }} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>;
  }
  if (loading) {
    return <Card className="bg-white border-gray-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="text-base md:text-lg text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            ⏰ Configuração de Horários por Dia
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Configure horários independentes para cada dia da semana
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-2 text-gray-700">Carregando configurações de horários...</span>
          </div>
          <div className="text-xs text-gray-500 text-center mt-2">
            Debug: User ID = {user?.id}
          </div>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-4">
      {/* Debug Info */}
      

      <Card className="bg-white border-gray-200 shadow-lg">
        
      <CardContent className="space-y-6">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => loadSchedules()} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Recarregar
            </Button>
          </div>
          
          {hasChanges && <Button onClick={saveSchedules} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </> : <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>}
            </Button>}
        </div>

        {/* Schedule Configuration */}
        <div className="space-y-4">
          {schedules.map(schedule => <div key={schedule.day_of_week} className="p-3 md:p-4 border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
              {/* Day Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span className="text-sm font-semibold text-gray-800 min-w-[100px] sm:min-w-[120px]">
                    {dayNames[schedule.day_of_week as keyof typeof dayNames]}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Switch checked={schedule.is_active} onCheckedChange={checked => updateSchedule(schedule.day_of_week, {
                    is_active: checked
                  })} className="data-[state=checked]:bg-green-600" />
                    <Badge variant={schedule.is_active ? "default" : "secondary"} className="text-xs whitespace-nowrap">
                      {schedule.is_active ? 'ABERTO' : 'FECHADO'}
                    </Badge>
                  </div>
                </div>
                
                {schedule.is_active && <Button variant="ghost" size="sm" onClick={() => copyToAllDays(schedule.day_of_week)} className="text-xs">
                    Copiar para todos
                  </Button>}
              </div>
              
              {/* Hours Configuration */}
              {schedule.is_active && <div className="space-y-4 ml-0 sm:ml-4 sm:border-l-2 sm:border-green-200 sm:pl-4 mt-4">
                  {/* Working Hours */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-green-600" />
                        Abertura
                      </Label>
                      <Input type="time" value={schedule.start_time} onChange={e => updateSchedule(schedule.day_of_week, {
                    start_time: e.target.value
                  })} className="text-sm h-9 border-gray-300 focus:border-green-500 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-green-600" />
                        Fechamento
                      </Label>
                      <Input type="time" value={schedule.end_time} onChange={e => updateSchedule(schedule.day_of_week, {
                    end_time: e.target.value
                  })} className="text-sm h-9 border-gray-300 focus:border-green-500 w-full" />
                    </div>
                  </div>

                  {/* Lunch Break Toggle */}
                  <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
                    <Switch checked={schedule.has_lunch_break} onCheckedChange={checked => updateSchedule(schedule.day_of_week, {
                  has_lunch_break: checked
                })} className="data-[state=checked]:bg-orange-600" />
                    <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <Coffee className="w-3 h-3 text-orange-600" />
                      Intervalo de almoço
                    </Label>
                  </div>

                  {/* Lunch Break Hours */}
                  {schedule.has_lunch_break && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-0 sm:pl-4 sm:border-l border-orange-200">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-600">
                          Início do almoço
                        </Label>
                        <Input type="time" value={schedule.lunch_start || '12:00'} onChange={e => updateSchedule(schedule.day_of_week, {
                    lunch_start: e.target.value
                  })} className="text-sm h-9 border-gray-300 focus:border-orange-500" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-600">
                          Fim do almoço
                        </Label>
                        <Input type="time" value={schedule.lunch_end || '13:00'} onChange={e => updateSchedule(schedule.day_of_week, {
                    lunch_end: e.target.value
                  })} className="text-sm h-9 border-gray-300 focus:border-orange-500" />
                      </div>
                    </div>}

                  {/* Schedule Summary */}
                  <div className="text-xs text-gray-500 bg-white p-2 rounded border">
                    <strong>Resumo:</strong> {schedule.start_time} às {schedule.end_time}
                    {schedule.has_lunch_break && schedule.lunch_start && schedule.lunch_end && <span> (Almoço: {schedule.lunch_start} às {schedule.lunch_end})</span>}
                  </div>
                </div>}
            </div>)}
        </div>

        {/* Save Button (Bottom) */}
        {hasChanges && <div className="flex justify-center pt-4 border-t">
            <Button onClick={saveSchedules} disabled={saving} size="lg" className="bg-green-600 hover:bg-green-700 px-8">
              {saving ? <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando Configurações...
                </> : <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Todas as Alterações
                </>}
            </Button>
          </div>}

        {/* Sync Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-800 text-sm">
            <RefreshCw className="w-4 h-4" />
            <strong>Sincronização Automática:</strong>
          </div>
          <p className="text-blue-700 text-xs mt-1">
            As alterações são aplicadas imediatamente na área pública de agendamento após salvar.
          </p>
        </div>
      </CardContent>
    </Card>
    </div>;
};
export default ScheduleSettings;