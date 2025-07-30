
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CompanyData {
  id: string;
  company_name: string;
  business_type?: string;
  profile_image_url?: string;
  slug?: string;
  working_days?: number[];
  working_hours_start?: string;
  working_hours_end?: string;
  appointment_interval?: number;
  lunch_break_enabled?: boolean;
  lunch_start_time?: string;
  lunch_end_time?: string;
  advance_booking_limit?: number;
  monthly_appointments_limit?: number;
  theme_color?: string;
  welcome_message?: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  instagram_url?: string;
  logo_url?: string;
  cover_image_url?: string;
  address?: string;
}

export const useCompanyData = (slug: string) => {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!slug) {
        setError('Slug não fornecido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Buscar dados da empresa nas configurações
        const { data: companySettings, error: settingsError } = await supabase
          .from('company_settings')
          .select('*')
          .eq('slug', slug)
          .eq('status_aberto', true)
          .single();

        if (settingsError) {
          console.error('Erro ao buscar configurações da empresa:', settingsError);
          setError('Empresa não encontrada ou inativa');
          return;
        }

        // Buscar dados do perfil da empresa
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('company_name, business_type, profile_image_url')
          .eq('id', companySettings.company_id)
          .single();

        if (profileError) {
          console.error('Erro ao buscar perfil da empresa:', profileError);
          // Continuar mesmo sem o perfil, usar apenas as configurações
        }

        // Combinar dados do perfil e configurações
        const combinedData: CompanyData = {
          id: companySettings.company_id,
          company_name: profileData?.company_name || 'Empresa',
          business_type: profileData?.business_type || undefined,
          profile_image_url: profileData?.profile_image_url || companySettings.logo_url || undefined,
          slug: companySettings.slug,
          working_days: companySettings.working_days,
          working_hours_start: companySettings.working_hours_start,
          working_hours_end: companySettings.working_hours_end,
          appointment_interval: companySettings.appointment_interval,
          lunch_break_enabled: companySettings.lunch_break_enabled,
          lunch_start_time: companySettings.lunch_start_time,
          lunch_end_time: companySettings.lunch_end_time,
          advance_booking_limit: companySettings.advance_booking_limit,
          monthly_appointments_limit: companySettings.monthly_appointments_limit,
          theme_color: companySettings.theme_color,
          welcome_message: companySettings.welcome_message,
          description: companySettings.description,
          phone: companySettings.phone,
          whatsapp: companySettings.whatsapp,
          instagram_url: companySettings.instagram_url,
          logo_url: companySettings.logo_url,
          cover_image_url: companySettings.cover_image_url,
          address: companySettings.address,
        };

        setCompanyData(combinedData);
      } catch (error: any) {
        console.error('Erro geral ao buscar dados da empresa:', error);
        setError('Erro interno do servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [slug]);

  return { companyData, loading, error };
};
