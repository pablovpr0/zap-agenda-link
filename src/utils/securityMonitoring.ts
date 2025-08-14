
// Security monitoring and logging utilities
import { getNowInBrazil } from '@/utils/timezone';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

export const logSecurityEvent = (event: {
  type: 'rate_limit_exceeded' | 'invalid_input' | 'unauthorized_access' | 'booking_attempt';
  identifier?: string;
  details?: any;
  severity?: 'low' | 'medium' | 'high';
}) => {
  const timestamp = getNowInBrazil().toISOString();
  const logEntry = {
    timestamp,
    ...event,
    user_agent: navigator?.userAgent,
    url: window?.location?.href
  };
  
  // Log to console for development
  devWarn('🔒 Security Event:', logEntry);
  
  // In production, you might want to send this to a security monitoring service
  // Example: sendToSecurityService(logEntry);
};

export const detectSuspiciousActivity = (formData: any): boolean => {
  // Check for common attack patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /eval\(/i,
    /document\./i,
    /window\./i
  ];
  
  const dataString = JSON.stringify(formData).toLowerCase();
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(dataString)) {
      logSecurityEvent({
        type: 'invalid_input',
        details: { pattern: pattern.toString(), data: formData },
        severity: 'high'
      });
      return true;
    }
  }
  
  return false;
};

export const sanitizeForLog = (data: any): any => {
  // Remove sensitive information from logs
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    
    // Remove or mask sensitive fields
    if (sanitized.clientPhone) {
      sanitized.clientPhone = `${sanitized.clientPhone.substring(0, 4)}****`;
    }
    if (sanitized.clientEmail) {
      const emailParts = sanitized.clientEmail.split('@');
      if (emailParts.length === 2) {
        sanitized.clientEmail = `${emailParts[0].substring(0, 2)}***@${emailParts[1]}`;
      }
    }
    
    return sanitized;
  }
  
  return data;
};

export const validateCSRFToken = (): boolean => {
  // Basic CSRF protection - in a real app you'd implement proper CSRF tokens
  const referrer = document.referrer;
  const origin = window.location.origin;
  
  // Allow same-origin requests
  if (!referrer || referrer.startsWith(origin)) {
    return true;
  }
  
  logSecurityEvent({
    type: 'unauthorized_access',
    details: { referrer, origin },
    severity: 'medium'
  });
  
  return false;
};
