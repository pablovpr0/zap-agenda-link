import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, Save } from 'lucide-react';
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
    1: 'Segunda',
    2: 'Terça',
    3: 'Quarta',
    4: 'Quinta',
    5: 'Sexta',
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
  return (
    <Card className="bg-white border-gray-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardTitle className="text-base md:text-lg text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600" />
          ⏰ Horários de Funcionamento
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Configure os horários de cada dia da semana
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4 p-4">
        {schedules.map(schedule => (
          <div key={schedule.day_of_week} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            {/* Linha principal: Nome do dia + Status + Horários */}
            <div className="flex items-center justify-between gap-4 mb-3">
              {/* Nome do dia */}
              <div className="min-w-[80px]">
                <span className="font-medium text-gray-800">
                  {dayNames[schedule.day_of_week as keyof typeof dayNames]}
                </span>
              </div>
              
              {/* Botão Aberto/Fechado */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={schedule.is_active ? "default" : "destructive"}
                  onClick={() => updateSchedule(schedule.day_of_week, { is_active: !schedule.is_active })}
                  className={`px-4 py-2 font-medium rounded-md transition-colors ${
                    schedule.is_active 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {schedule.is_active ? 'ABERTO' : 'FECHADO'}
                </Button>
              </div>
              
              {/* Horários de funcionamento */}
              {schedule.is_active && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <Input
                      type="time"
                      value={schedule.start_time}
                      onChange={(e) => updateSchedule(schedule.day_of_week, { start_time: e.target.value })}
                      className="w-20 h-8 text-sm"
                    />
                  </div>
                  <span className="text-gray-500">às</span>
                  <Input
                    type="time"
                    value={schedule.end_time}
                    onChange={(e) => updateSchedule(schedule.day_of_week, { end_time: e.target.value })}
                    className="w-20 h-8 text-sm"
                  />
                </div>
              )}
            </div>
            
            {/* Horário de almoço (embaixo) */}
            {schedule.is_active && (
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Almoço</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateSchedule(schedule.day_of_week, { has_lunch_break: !schedule.has_lunch_break })}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        schedule.has_lunch_break 
                          ? 'bg-orange-600 text-white border-orange-600 hover:bg-orange-700' 
                          : 'bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300'
                      }`}
                    >
                      {schedule.has_lunch_break ? 'ATIVO' : 'INATIVO'}
                    </Button>
                    
                    {schedule.has_lunch_break && (
                      <>
                        <Input
                          type="time"
                          value={schedule.lunch_start || '12:00'}
                          onChange={(e) => updateSchedule(schedule.day_of_week, { lunch_start: e.target.value })}
                          className="w-20 h-8 text-sm"
                        />
                        <span className="text-gray-500 text-sm">às</span>
                        <Input
                          type="time"
                          value={schedule.lunch_end || '13:00'}
                          onChange={(e) => updateSchedule(schedule.day_of_week, { lunch_end: e.target.value })}
                          className="w-20 h-8 text-sm"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Botão de salvar */}
        {hasChanges && (
          <div className="flex justify-center pt-4 border-t">
            <Button 
              onClick={saveSchedules} 
              disabled={saving} 
              className="bg-green-600 hover:bg-green-700 px-8"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
export default ScheduleSettings;