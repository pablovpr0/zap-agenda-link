import { devLog, devWarn, devError } from '@/utils/console';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  totalMetrics: number;
  averageDuration: number;
  slowestOperation: PerformanceMetric | null;
  fastestOperation: PerformanceMetric | null;
  operationsByType: Record<string, PerformanceMetric[]>;
  memoryUsage?: MemoryInfo;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private completedMetrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000;
  private reportInterval: NodeJS.Timeout | null = null;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    this.startPeriodicReporting();
    this.setupMemoryMonitoring();
  }

  /**
   * Inicia medição de performance
   */
  start(name: string, metadata?: Record<string, any>): string {
    const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };

    this.metrics.set(id, metric);
    devLog(`⏱️ Performance START: ${name}`, metadata);
    
    return id;
  }

  /**
   * Finaliza medição de performance
   */
  end(id: string, additionalMetadata?: Record<string, any>): number | null {
    const metric = this.metrics.get(id);
    
    if (!metric) {
      devWarn(`⚠️ Performance metric not found: ${id}`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    
    if (additionalMetadata) {
      metric.metadata = { ...metric.metadata, ...additionalMetadata };
    }

    // Mover para métricas completadas
    this.completedMetrics.push(metric);
    this.metrics.delete(id);

    // Limitar número de métricas armazenadas
    if (this.completedMetrics.length > this.maxMetrics) {
      this.completedMetrics = this.completedMetrics.slice(-this.maxMetrics);
    }

    devLog(`⏱️ Performance END: ${metric.name} (${metric.duration.toFixed(2)}ms)`, metric.metadata);
    
    // Alertar sobre operações lentas
    if (metric.duration > 1000) {
      devWarn(`🐌 Slow operation detected: ${metric.name} took ${metric.duration.toFixed(2)}ms`);
    }

    return metric.duration;
  }

  /**
   * Mede uma função assíncrona
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const id = this.start(name, metadata);
    
    try {
      const result = await fn();
      this.end(id, { success: true });
      return result;
    } catch (error) {
      this.end(id, { success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Mede uma função síncrona
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const id = this.start(name, metadata);
    
    try {
      const result = fn();
      this.end(id, { success: true });
      return result;
    } catch (error) {
      this.end(id, { success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Gera relatório de performance
   */
  generateReport(): PerformanceReport {
    const metrics = this.completedMetrics;
    
    if (metrics.length === 0) {
      return {
        totalMetrics: 0,
        averageDuration: 0,
        slowestOperation: null,
        fastestOperation: null,
        operationsByType: {},
        memoryUsage: this.getMemoryUsage()
      };
    }

    const durations = metrics.map(m => m.duration!).filter(d => d !== undefined);
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    
    const slowestOperation = metrics.reduce((slowest, current) => 
      (current.duration || 0) > (slowest?.duration || 0) ? current : slowest
    );
    
    const fastestOperation = metrics.reduce((fastest, current) => 
      (current.duration || Infinity) < (fastest?.duration || Infinity) ? current : fastest
    );

    // Agrupar por tipo de operação
    const operationsByType: Record<string, PerformanceMetric[]> = {};
    metrics.forEach(metric => {
      if (!operationsByType[metric.name]) {
        operationsByType[metric.name] = [];
      }
      operationsByType[metric.name].push(metric);
    });

    return {
      totalMetrics: metrics.length,
      averageDuration,
      slowestOperation,
      fastestOperation,
      operationsByType,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Obtém métricas por tipo de operação
   */
  getMetricsByType(operationType: string): PerformanceMetric[] {
    return this.completedMetrics.filter(metric => metric.name === operationType);
  }

  /**
   * Obtém estatísticas de uma operação específica
   */
  getOperationStats(operationType: string) {
    const metrics = this.getMetricsByType(operationType);
    
    if (metrics.length === 0) {
      return null;
    }

    const durations = metrics.map(m => m.duration!).filter(d => d !== undefined);
    const total = durations.reduce((sum, d) => sum + d, 0);
    const average = total / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    // Calcular percentis
    const sorted = durations.sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p90 = sorted[Math.floor(sorted.length * 0.9)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];

    return {
      operationType,
      count: metrics.length,
      total,
      average,
      min,
      max,
      percentiles: { p50, p90, p95 },
      successRate: metrics.filter(m => m.metadata?.success).length / metrics.length
    };
  }

  /**
   * Limpa métricas antigas
   */
  clearMetrics(): void {
    this.completedMetrics = [];
    this.metrics.clear();
    devLog('🧹 Performance metrics cleared');
  }

  /**
   * Obtém uso de memória
   */
  private getMemoryUsage(): MemoryInfo | undefined {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return undefined;
  }

  /**
   * Inicia relatórios periódicos
   */
  private startPeriodicReporting(): void {
    this.reportInterval = setInterval(() => {
      const report = this.generateReport();
      
      if (report.totalMetrics > 0) {
        devLog('📊 Performance Report:', {
          totalMetrics: report.totalMetrics,
          averageDuration: `${report.averageDuration.toFixed(2)}ms`,
          slowestOperation: report.slowestOperation ? {
            name: report.slowestOperation.name,
            duration: `${report.slowestOperation.duration?.toFixed(2)}ms`
          } : null,
          memoryUsage: report.memoryUsage ? {
            used: `${(report.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
            total: `${(report.memoryUsage.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`
          } : null
        });

        // Alertar sobre problemas de performance
        if (report.averageDuration > 500) {
          devWarn('⚠️ Average operation time is high:', `${report.averageDuration.toFixed(2)}ms`);
        }

        if (report.memoryUsage && report.memoryUsage.usedJSHeapSize > 100 * 1024 * 1024) {
          devWarn('⚠️ High memory usage detected:', `${(report.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
        }
      }
    }, 30000); // Relatório a cada 30 segundos
  }

  /**
   * Configura monitoramento de memória
   */
  private setupMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        
        if (usedMB > 150) {
          devWarn('🧠 High memory usage:', `${usedMB.toFixed(2)}MB`);
        }
      }, 60000); // Verificar a cada minuto
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }
    this.clearMetrics();
  }
}

// Instância singleton
export const performanceMonitor = PerformanceMonitor.getInstance();

// Decorador para medir métodos de classe
export function measurePerformance(operationName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const name = operationName || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: unknown[]) {
      return await performanceMonitor.measure(name, () => method.apply(this, args), {
        className: target.constructor.name,
        methodName: propertyName,
        argsCount: args.length
      });
    };

    return descriptor;
  };
}

// Hook React para monitoramento de performance
export const usePerformanceMonitor = () => {
  const [report, setReport] = React.useState<PerformanceReport | null>(null);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setReport(performanceMonitor.generateReport());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const measureAsync = React.useCallback(async <T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    return await performanceMonitor.measure(name, fn, metadata);
  }, []);

  const measureSync = React.useCallback(<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T => {
    return performanceMonitor.measureSync(name, fn, metadata);
  }, []);

  return {
    report,
    measureAsync,
    measureSync,
    getOperationStats: performanceMonitor.getOperationStats.bind(performanceMonitor),
    clearMetrics: performanceMonitor.clearMetrics.bind(performanceMonitor)
  };
};

export default performanceMonitor;