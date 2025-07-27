import { getStorageData, setStorageData, MockCompanySettings, STORAGE_KEYS } from '@/data/mockData';

export const fetchCompanySettings = async (userId: string): Promise<any> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const settings = getStorageData<MockCompanySettings | null>(STORAGE_KEYS.COMPANY_SETTINGS, null);
  
  if (!settings || settings.company_id !== userId) {
    return null;
  }
  
  return settings;
};

export const createDefaultSettings = async (userId: string, companyName: string): Promise<void> => {
  const slug = await generateUniqueSlug(companyName);
  
  const defaultSettings: MockCompanySettings = {
    company_id: userId,
    company_name: companyName,
    company_slug: slug,
    working_hours_start: '09:00',
    working_hours_end: '18:00',
    working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    appointment_duration: 60,
    advance_booking_days: 30
  };

  setStorageData(STORAGE_KEYS.COMPANY_SETTINGS, defaultSettings);
};

export const generateUniqueSlug = async (companyName: string): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 50));
  
  let slug = companyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // For simplicity in frontend-only mode, just add timestamp if needed
  let counter = 0;
  let finalSlug = slug;
  
  while (await isSlugTaken(finalSlug)) {
    counter++;
    finalSlug = `${slug}-${counter}`;
  }

  return finalSlug;
};

export const isSlugTaken = async (slug: string): Promise<boolean> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const settings = getStorageData<MockCompanySettings | null>(STORAGE_KEYS.COMPANY_SETTINGS, null);
  return settings?.company_slug === slug;
};

export const updateCompanySlug = async (userId: string, newSlug: string): Promise<boolean> => {
  const validation = validateSlug(newSlug);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  if (await isSlugTaken(newSlug)) {
    throw new Error('Este slug já está em uso por outra empresa');
  }

  const settings = getStorageData<MockCompanySettings | null>(STORAGE_KEYS.COMPANY_SETTINGS, null);
  if (settings && settings.company_id === userId) {
    const updatedSettings = { ...settings, company_slug: newSlug };
    setStorageData(STORAGE_KEYS.COMPANY_SETTINGS, updatedSettings);
    return true;
  }

  return false;
};

export const validateSlug = (slug: string): { isValid: boolean; error?: string } => {
  if (!slug || slug.length < 3) {
    return { isValid: false, error: 'Slug deve ter pelo menos 3 caracteres' };
  }

  if (slug.length > 50) {
    return { isValid: false, error: 'Slug deve ter no máximo 50 caracteres' };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { isValid: false, error: 'Slug pode conter apenas letras minúsculas, números e hífens' };
  }

  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { isValid: false, error: 'Slug não pode começar ou terminar com hífen' };
  }

  if (slug.includes('--')) {
    return { isValid: false, error: 'Slug não pode conter hífens consecutivos' };
  }

  const reservedWords = ['admin', 'api', 'www', 'mail', 'ftp', 'localhost', 'root', 'support', 'help'];
  if (reservedWords.includes(slug)) {
    return { isValid: false, error: 'Este slug é uma palavra reservada' };
  }

  return { isValid: true };
};