import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CompanySettings, 
  getCompanySettings, 
  updateCompanySettings, 
  subscribeToSettingsUpdates,
  UpdateCompanySettingsParams 
} from '@/services/companySettingsService';
import { devLog, devError } from '@/utils/console';

// Cache global para otimização de performance
const settingsCache = new Map<string, { data: CompanySettings; timestamp: number }>();
const CACHE_TTL = 30000; // 30 segundos

interface UseCompanySettingsRealtimeReturn {
  settings: CompanySettings | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  updateSettings: (params: Omit<UpdateCompanySettingsParams, 'company_id'>) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
  lastUpdated: Date | null;
}

export const useCompanySettingsRealtime = (companyId: string): UseCompanySettingsRealtimeReturn => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar configurações com cache e retry automático
  const loadSettings = useCallback(async (useCache = true) => {
    if (!companyId) return;
    
    // Verificar cache primeiro
    if (useCache) {
      const cached = settingsCache.get(companyId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setSettings(cached.data);
        setLastUpdated(new Date(cached.data.updated_at));
        setIsLoading(false);
        return;
      }
    }
    
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      setIsLoading(true);
      setError(null);
      
      devLog('🔄 Carregando configurações da empresa:', companyId);
      
      const data = await getCompanySettings(companyId);
      
      if (data) {
        // Atualizar cache
        settingsCache.set(companyId, { data, timestamp: Date.now() });
        
        setSettings(data);
        setLastUpdated(new Date(data.updated_at));
        devLog('✅ Configurações carregadas:', data);
      } else {
        throw new Error('Configurações não encontradas');
      }
      
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      
      devError('❌ Erro ao carregar configurações:', err);
      setError('Erro ao carregar configurações');
      
      // Retry automático após 3 segundos
      retryTimeoutRef.current = setTimeout(() => {
        loadSettings(false);
      }, 3000);
      
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  // Atualizar configurações
  const updateSettingsHandler = useCallback(async (
    params: Omit<UpdateCompanySettingsParams, 'company_id'>
  ): Promise<boolean> => {
    if (!companyId) return false;
    
    try {
      setIsUpdating(true);
      setError(null);
      
      devLog('🔄 Atualizando configurações:', params);
      
      const updatedSettings = await updateCompanySettings({
        ...params,
        company_id: companyId
      });
      
      if (updatedSettings) {
        setSettings(updatedSettings);
        setLastUpdated(new Date(updatedSettings.updated_at));
        devLog('✅ Configurações atualizadas com sucesso');
        return true;
      } else {
        setError('Erro ao atualizar configurações');
        return false;
      }
      
    } catch (err) {
      devError('❌ Erro ao atualizar configurações:', err);
      setError('Erro ao atualizar configurações');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [companyId]);

  // Refresh manual
  const refreshSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  // Configurar sincronização em tempo real
  useEffect(() => {
    if (!companyId) return;

    // Carregar configurações iniciais
    loadSettings();

    // Configurar subscription para atualizações em tempo real
    const unsubscribe = subscribeToSettingsUpdates(companyId, (updatedSettings) => {
      devLog('📡 Configurações atualizadas via Realtime:', updatedSettings);
      setSettings(updatedSettings);
      setLastUpdated(new Date(updatedSettings.updated_at));
    });

    return () => {
      unsubscribe();
    };
  }, [companyId, loadSettings]);

  return {
    settings,
    isLoading,
    isUpdating,
    error,
    updateSettings: updateSettingsHandler,
    refreshSettings,
    lastUpdated
  };
};

/**
 * Hook específico para página pública de agendamento
 * Foca apenas na leitura das configurações com sincronização
 */
export const usePublicCompanySettings = (companyId: string) => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    if (!companyId) return;

    let mounted = true;

    const loadSettings = async () => {
      try {
        devLog('🔄 [PUBLIC] Carregando configurações:', companyId);
        
        const data = await getCompanySettings(companyId);
        
        if (mounted && data) {
          setSettings(data);
          setLastSync(new Date());
          devLog('✅ [PUBLIC] Configurações carregadas:', data);
        }
        
      } catch (error) {
        devError('❌ [PUBLIC] Erro ao carregar configurações:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Carregar configurações iniciais
    loadSettings();

    // Configurar sincronização em tempo real
    const unsubscribe = subscribeToSettingsUpdates(companyId, (updatedSettings) => {
      if (mounted) {
        devLog('📡 [PUBLIC] Configurações atualizadas via Realtime:', updatedSettings);
        setSettings(updatedSettings);
        setLastSync(new Date());
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [companyId]);

  return {
    settings,
    isLoading,
    lastSync,
    // Funções utilitárias baseadas nas configurações
    isDateAllowed: useCallback((date: Date) => {
      if (!settings) return false;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Verificar se permite agendamento no mesmo dia
      if (diffDays === 0 && !settings.same_day_booking) {
        return false;
      }
      
      // Verificar limite de dias futuros
      if (diffDays > settings.advance_booking_limit) {
        return false;
      }
      
      return diffDays >= 0;
    }, [settings]),
    
    isDayActive: useCallback((dayOfWeek: string) => {
      if (!settings) return false;
      return settings.opening_hours[dayOfWeek]?.active || false;
    }, [settings])
  };
};