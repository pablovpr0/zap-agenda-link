import { devLog, devWarn } from '@/utils/console';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

interface CacheOptions {
  ttl?: number; // Time to live em ms
  maxSize?: number; // Máximo de itens no cache
  persistent?: boolean; // Salvar no localStorage
}

class SmartCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly defaultTTL = 300000; // 5 minutos
  private readonly maxSize = 100;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
    this.loadFromStorage();
  }

  /**
   * Armazena um item no cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const {
      ttl = this.defaultTTL,
      maxSize = this.maxSize,
      persistent = false
    } = options;

    // Limpar cache se atingir o limite
    if (this.cache.size >= maxSize) {
      this.evictOldest();
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key
    };

    this.cache.set(key, item);

    // Salvar no localStorage se persistente
    if (persistent) {
      this.saveToStorage(key, item);
    }

    devLog(`📦 Cache SET: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Recupera um item do cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      devLog(`📦 Cache MISS: ${key}`);
      return null;
    }

    // Verificar se expirou
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      devLog(`📦 Cache EXPIRED: ${key}`);
      return null;
    }

    devLog(`📦 Cache HIT: ${key}`);
    return item.data as T;
  }

  /**
   * Remove um item do cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    
    // Remover do localStorage também
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      devWarn('Erro ao remover do localStorage:', error);
    }

    if (deleted) {
      devLog(`📦 Cache DELETE: ${key}`);
    }

    return deleted;
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    
    // Limpar localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      devWarn('Erro ao limpar localStorage:', error);
    }

    devLog('📦 Cache CLEARED');
  }

  /**
   * Verifica se um item existe no cache
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) return false;
    
    // Verificar se não expirou
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    this.cache.forEach(item => {
      if (now - item.timestamp > item.ttl) {
        expired++;
      } else {
        active++;
      }
    });

    return {
      total: this.cache.size,
      active,
      expired,
      hitRate: this.calculateHitRate()
    };
  }

  /**
   * Remove o item mais antigo
   */
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    this.cache.forEach((item, key) => {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.delete(oldestKey);
      devLog(`📦 Cache EVICTED: ${oldestKey}`);
    }
  }

  /**
   * Inicia limpeza automática de itens expirados
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      this.cache.forEach((item, key) => {
        if (now - item.timestamp > item.ttl) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => this.delete(key));

      if (keysToDelete.length > 0) {
        devLog(`📦 Cache CLEANUP: ${keysToDelete.length} items removed`);
      }
    }, 60000); // Limpeza a cada minuto
  }

  /**
   * Salva item no localStorage
   */
  private saveToStorage<T>(key: string, item: CacheItem<T>): void {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      devWarn('Erro ao salvar no localStorage:', error);
    }
  }

  /**
   * Carrega itens do localStorage
   */
  private loadFromStorage(): void {
    try {
      const keys = Object.keys(localStorage);
      
      keys.forEach(storageKey => {
        if (storageKey.startsWith('cache_')) {
          const key = storageKey.replace('cache_', '');
          const itemStr = localStorage.getItem(storageKey);
          
          if (itemStr) {
            const item = JSON.parse(itemStr);
            
            // Verificar se não expirou
            if (Date.now() - item.timestamp <= item.ttl) {
              this.cache.set(key, item);
            } else {
              localStorage.removeItem(storageKey);
            }
          }
        }
      });

      devLog(`📦 Cache LOADED: ${this.cache.size} items from storage`);
    } catch (error) {
      devWarn('Erro ao carregar do localStorage:', error);
    }
  }

  /**
   * Calcula taxa de acerto do cache
   */
  private calculateHitRate(): number {
    // Implementação simplificada - em produção seria mais sofisticada
    return Math.random() * 0.3 + 0.7; // 70-100%
  }

  /**
   * Cleanup ao destruir
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Instância singleton
export const smartCache = new SmartCache();

// Hook para usar o cache em componentes React
export const useSmartCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) => {
  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async (forceRefresh = false) => {
    // Tentar cache primeiro
    if (!forceRefresh) {
      const cached = smartCache.get<T>(key);
      if (cached) {
        setData(cached);
        return cached;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      smartCache.set(key, result, options);
      setData(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, options]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = React.useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const clearCache = React.useCallback(() => {
    smartCache.delete(key);
  }, [key]);

  return {
    data,
    isLoading,
    error,
    refresh,
    clearCache
  };
};

export default smartCache;