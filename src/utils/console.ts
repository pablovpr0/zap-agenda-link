// Utilitário para controlar logs em produção
const isDevelopment = import.meta.env.DEV;

// Função que substitui console.log em produção
export const devLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

export const devError = (...args: any[]) => {
  if (isDevelopment) {
    console.error(...args);
  }
};

export const devWarn = (...args: any[]) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

export const devInfo = (...args: any[]) => {
  if (isDevelopment) {
    console.info(...args);
  }
};

// Função para logs críticos que devem aparecer sempre (apenas erros importantes)
export const criticalError = (...args: any[]) => {
  console.error(...args);
};