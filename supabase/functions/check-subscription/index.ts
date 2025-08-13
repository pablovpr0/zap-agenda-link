
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists in Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      await supabaseClient.from("subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        status: "inactive",
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      
      return new Response(JSON.stringify({ 
        subscribed: false, 
        status: "inactive",
        current_period_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    let subscriptionData = {
      subscribed: false,
      status: "inactive" as string,
      current_period_end: null as string | null,
      stripe_customer_id: customerId,
      stripe_subscription_id: null as string | null,
    };

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      subscriptionData = {
        subscribed: true,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
      };
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        status: subscription.status,
        endDate: subscriptionData.current_period_end 
      });
    } else {
      // Check for other statuses (past_due, canceled, etc)
      const allSubs = await stripe.subscriptions.list({
        customer: customerId,
        limit: 1,
      });
      
      if (allSubs.data.length > 0) {
        const subscription = allSubs.data[0];
        subscriptionData.status = subscription.status;
        subscriptionData.stripe_subscription_id = subscription.id;
        subscriptionData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
        logStep("Found subscription with status", { status: subscription.status });
      }
    }

    // Update subscription in database
    await supabaseClient.from("subscriptions").upsert({
      user_id: user.id,
      stripe_customer_id: subscriptionData.stripe_customer_id,
      stripe_subscription_id: subscriptionData.stripe_subscription_id,
      status: subscriptionData.status,
      current_period_start: subscriptionData.subscribed ? new Date().toISOString() : null,
      current_period_end: subscriptionData.current_period_end,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    logStep("Updated database with subscription info", { 
      subscribed: subscriptionData.subscribed, 
      status: subscriptionData.status 
    });

    return new Response(JSON.stringify(subscriptionData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
