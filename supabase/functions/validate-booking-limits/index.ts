import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  // Logs desabilitados em produção por segurança
  const isDev = Deno.env.get("ENVIRONMENT") === "development";
  if (isDev) {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[VALIDATE-BOOKING-LIMITS] ${step}${detailsStr}`);
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { companyId, clientPhone } = await req.json();

    if (!companyId || !clientPhone) {
      throw new Error("Company ID and client phone are required");
    }

    logStep("Validating booking limits", { companyId, clientPhone });

    // Verificar se a empresa é admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', companyId)
      .single();

    const isAdminCompany = profile?.is_admin || false;

    if (isAdminCompany) {
      logStep("Admin company - skipping limits");
      return new Response(JSON.stringify({
        canBook: true,
        isAdmin: true,
        simultaneousLimit: { canBook: true, currentCount: 0, limit: 0 },
        monthlyLimit: { canBook: true, currentCount: 0, limit: 0 }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Buscar configurações da empresa
    const { data: settings, error: settingsError } = await supabaseClient
      .from('company_settings')
      .select('max_simultaneous_appointments, monthly_appointments_limit')
      .eq('company_id', companyId)
      .single();

    if (settingsError) {
      throw new Error(`Error fetching company settings: ${settingsError.message}`);
    }

    const simultaneousLimit = settings?.max_simultaneous_appointments || 3;
    const monthlyLimit = settings?.monthly_appointments_limit;

    // Buscar cliente
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('id')
      .eq('phone', clientPhone)
      .eq('company_id', companyId)
      .single();

    if (clientError || !client) {
      // Cliente novo - pode agendar
      return new Response(JSON.stringify({
        canBook: true,
        isAdmin: false,
        simultaneousLimit: { canBook: true, currentCount: 0, limit: simultaneousLimit },
        monthlyLimit: { canBook: true, currentCount: 0, limit: monthlyLimit || 0 }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // VALIDAÇÃO 1: Limite simultâneo
    const { data: activeAppointments, error: activeError } = await supabaseClient
      .from('appointments')
      .select('id')
      .eq('company_id', companyId)
      .eq('client_id', client.id)
      .in('status', ['confirmed', 'in_progress'])
      .gte('appointment_date', new Date().toISOString().split('T')[0]);

    if (activeError) {
      throw new Error(`Error fetching active appointments: ${activeError.message}`);
    }

    const currentActiveCount = activeAppointments?.length || 0;
    const canBookSimultaneous = currentActiveCount < simultaneousLimit;

    // VALIDAÇÃO 2: Limite mensal (se configurado)
    let canBookMonthly = true;
    let monthlyCount = 0;

    if (monthlyLimit) {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data: monthlyAppointments, error: monthlyError } = await supabaseClient
        .from('appointments')
        .select('id')
        .eq('company_id', companyId)
        .eq('client_id', client.id)
        .gte('appointment_date', `${currentMonth}-01`)
        .lt('appointment_date', `${currentMonth}-32`)
        .neq('status', 'cancelled');

      if (monthlyError) {
        throw new Error(`Error fetching monthly appointments: ${monthlyError.message}`);
      }

      monthlyCount = monthlyAppointments?.length || 0;
      canBookMonthly = monthlyCount < monthlyLimit;
    }

    const canBook = canBookSimultaneous && canBookMonthly;

    logStep("Validation completed", {
      canBook,
      simultaneousCheck: { canBook: canBookSimultaneous, currentCount: currentActiveCount, limit: simultaneousLimit },
      monthlyCheck: { canBook: canBookMonthly, currentCount: monthlyCount, limit: monthlyLimit }
    });

    return new Response(JSON.stringify({
      canBook,
      isAdmin: false,
      simultaneousLimit: {
        canBook: canBookSimultaneous,
        currentCount: currentActiveCount,
        limit: simultaneousLimit,
        message: !canBookSimultaneous ? `Você já possui ${currentActiveCount} agendamento(s) ativo(s). Limite: ${simultaneousLimit}` : undefined
      },
      monthlyLimit: {
        canBook: canBookMonthly,
        currentCount: monthlyCount,
        limit: monthlyLimit || 0,
        message: !canBookMonthly ? `Você já atingiu o limite de ${monthlyLimit} agendamentos este mês.` : undefined
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in validate-booking-limits", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});