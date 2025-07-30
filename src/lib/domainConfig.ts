
// Configuration for domain handling
const CUSTOM_DOMAIN = 'https://zapagenda.site';
const DEV_DOMAIN = 'http://localhost:5173';

export const getDomainConfig = () => {
  // In development, use localhost
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return DEV_DOMAIN;
  }
  
  // In production, always use the custom domain
  return CUSTOM_DOMAIN;
};

export const generatePublicBookingUrl = (slug: string): string => {
  const baseDomain = getDomainConfig();
  return `${baseDomain}/public/${slug}`;
};
