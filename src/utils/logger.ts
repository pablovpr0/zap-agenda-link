
import { devLog, devError, devWarn } from '@/utils/console';

interface LogData {
  action: string;
  details?: any;
  userId?: string;
  companyId?: string;
  timestamp?: string;
}

export const logUserAction = (data: LogData) => {
  try {
    const logEntry = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    devLog('👤 User Action:', logEntry);
    
    // In production, you might want to send this to an analytics service
    // analytics.track(data.action, logEntry);
    
  } catch (error) {
    devError('❌ Error logging user action:', error);
  }
};

export const logError = (error: any, context?: string) => {
  try {
    const errorData = {
      message: error?.message || String(error),
      stack: error?.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    devError('🚨 Application Error:', errorData);
    
    // In production, send to error tracking service
    // errorTracking.captureException(error, { extra: errorData });
    
  } catch (logError) {
    devError('❌ Error in error logging:', logError);
  }
};

export const logBookingEvent = (event: string, data?: any) => {
  try {
    const eventData = {
      event,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    devLog('📅 Booking Event:', eventData);
    
  } catch (error) {
    devWarn('⚠️ Warning: Could not log booking event:', error);
  }
};

export const logPerformance = (metric: string, value: number, unit = 'ms') => {
  try {
    const perfData = {
      metric,
      value,
      unit,
      timestamp: new Date().toISOString()
    };
    
    devLog('⚡ Performance Metric:', perfData);
    
  } catch (error) {
    devWarn('⚠️ Warning: Could not log performance metric:', error);
  }
};

export const logDebug = (message: string, data?: any) => {
  try {
    devLog(`🐛 Debug: ${message}`, data);
  } catch (error) {
    // Silent fail for debug logs
  }
};
