
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Use service role key to bypass RLS for writes
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user is admin
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logStep("Error fetching profile", { error: profileError });
    } else if (profileData?.is_admin) {
      logStep("Admin user trying to create checkout - access already granted");
      return new Response(JSON.stringify({ 
        error: "Admin users don't need to subscribe",
        redirect_to_dashboard: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer, will create new one");
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    // Create checkout session with the specific price ID
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: "price_1Rul4aAGs1NuWqco0F4AJn5p", // R$ 39,90/mês
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/?subscription=success`,
      cancel_url: `${origin}/?subscription=cancelled`,
      metadata: {
        user_id: user.id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Create or update subscription record as pending
    await supabaseClient.from("subscriptions").upsert({
      user_id: user.id,
      status: "pending",
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    logStep("Subscription record updated to pending");

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
