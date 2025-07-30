
// Configuration for domain handling
const CUSTOM_DOMAIN = 'https://zapagenda.site';
const DEV_DOMAIN = 'http://localhost:5173';

export const getDomainConfig = () => {
  // In development, use localhost
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1')) {
    return DEV_DOMAIN;
  }
  
  // Always use custom domain in production, regardless of current hostname
  return CUSTOM_DOMAIN;
};

export const generatePublicBookingUrl = (slug: string): string => {
  // Always use custom domain for public booking URLs
  return `${CUSTOM_DOMAIN}/public/${slug}`;
};
