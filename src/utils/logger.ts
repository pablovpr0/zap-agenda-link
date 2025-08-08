/**
 * Sistema de logging seguro para produção
 * 
 * Logs são exibidos apenas em desenvolvimento e não expõem dados sensíveis
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Log de informação - apenas em desenvolvimento
   */
  info: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`ℹ️ ${message}`, data ? sanitizeData(data) : '');
    }
  },

  /**
   * Log de erro - sempre exibido mas dados sanitizados
   */
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`❌ ${message}`, error);
    } else {
      // Em produção, log apenas a mensagem sem dados sensíveis
      console.error(`❌ ${message}`);
    }
  },

  /**
   * Log de aviso - sempre exibido mas dados sanitizados
   */
  warn: (message: string, data?: any) => {
    if (isDevelopment) {
      console.warn(`⚠️ ${message}`, data ? sanitizeData(data) : '');
    } else {
      console.warn(`⚠️ ${message}`);
    }
  },

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`🔍 ${message}`, data ? sanitizeData(data) : '');
    }
  },

  /**
   * Log de sucesso - apenas em desenvolvimento
   */
  success: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`✅ ${message}`, data ? sanitizeData(data) : '');
    }
  }
};

/**
 * Sanitiza dados removendo informações sensíveis
 */
function sanitizeData(data: any): any {
  if (!data) return data;

  // Se é string, verificar se contém dados sensíveis
  if (typeof data === 'string') {
    // Mascarar IDs que parecem ser UUIDs
    return data.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '***-***-***');
  }

  // Se é objeto, sanitizar recursivamente
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = Array.isArray(data) ? [] : {};
    
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        // Campos sensíveis que devem ser mascarados
        const sensitiveFields = [
          'company_id', 'companyId', 'id', 'client_id', 'clientId',
          'phone', 'email', 'password', 'token', 'key', 'secret'
        ];

        if (sensitiveFields.includes(key.toLowerCase())) {
          sanitized[key] = '***';
        } else {
          sanitized[key] = sanitizeData(data[key]);
        }
      }
    }
    
    return sanitized;
  }

  return data;
}

/**
 * Log específico para performance - apenas em desenvolvimento
 */
export const performanceLogger = {
  start: (operation: string) => {
    if (isDevelopment) {
      console.time(`⏱️ ${operation}`);
    }
  },

  end: (operation: string) => {
    if (isDevelopment) {
      console.timeEnd(`⏱️ ${operation}`);
    }
  }
};