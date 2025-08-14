import { supabase } from '@/integrations/supabase/client';
import { PublicThemeSettings } from '@/types/publicTheme';
import { devLog, devError, devWarn, devInfo } from '@/utils/console';

export const savePublicThemeSettings = async (settings: PublicThemeSettings): Promise<PublicThemeSettings> => {
  try {
    const { data, error } = await (supabase as any)
      .from('public_theme_settings')
      .upsert({
        company_id: settings.company_id,
        theme_color: settings.theme_color,
        dark_mode: settings.dark_mode,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'company_id'
      })
      .select()
      .single();

    if (error) {
      devError('Error saving public theme settings:', error);
      throw error;
    }

    return data;
  } catch (error) {
    devError('Failed to save public theme settings:', error);
    throw error;
  }
};

export const loadPublicThemeSettings = async (companyId: string): Promise<PublicThemeSettings | null> => {
  try {
  const { data, error } = await (supabase as any)
    .from('public_theme_settings')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();

    if (error) {
      devError('Error loading public theme settings:', error);
      throw error;
    }

    return data;
  } catch (error) {
    devError('Failed to load public theme settings:', error);
    return null;
  }
};

export const loadPublicThemeBySlug = async (companySlug: string): Promise<PublicThemeSettings | null> => {
  try {
    // Primeiro, buscar o company_id pelo slug
    const { data: companyData, error: companyError } = await supabase
      .from('company_settings')
      .select('company_id')
      .eq('slug', companySlug)
      .eq('status_aberto', true)
      .maybeSingle();

    if (companyError || !companyData) {
      devError('Company not found for slug:', companySlug);
      return null;
    }

    // Buscar as configurações de tema
    const { data: themeData, error: themeError } = await (supabase as any)
      .from('public_theme_settings')
      .select('*')
      .eq('company_id', companyData.company_id)
      .maybeSingle();

    if (themeError) {
      devError('Error loading theme settings:', themeError);
      return null;
    }

    return themeData;
  } catch (error) {
    devError('Failed to load public theme by slug:', error);
    return null;
  }
};