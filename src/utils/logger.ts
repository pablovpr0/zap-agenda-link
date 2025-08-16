
import { devLog, devError } from '@/utils/console';

export const logError = (error: unknown, context?: string) => {
  const errorData = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString()
  };
  
  devError('🚨 Application Error:', errorData);
};

export const logBookingEvent = (event: string, data?: unknown) => {
  devLog('📅 Booking Event:', { event, data, timestamp: new Date().toISOString() });
};
