const isDevelopment = import.meta.env.DEV;

type LogLevel = 'log' | 'error' | 'warn' | 'info';

const createLogger = (level: LogLevel, shouldLog: boolean = isDevelopment) => 
  (...args: unknown[]) => shouldLog && console[level](...args);

export const devLog = createLogger('log');
export const devError = createLogger('error');
export const devWarn = createLogger('warn');
export const devInfo = createLogger('info');
export const criticalError = createLogger('error', true);