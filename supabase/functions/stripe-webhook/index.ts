
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Use service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("No stripe-signature header");
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Webhook signature verified", { eventType: event.type, eventId: event.id });

    let subscription: Stripe.Subscription | null = null;
    let customerId: string | null = null;

    // Extract subscription and customer data based on event type
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        subscription = event.data.object as Stripe.Subscription;
        customerId = subscription.customer as string;
        break;
      case "invoice.payment_succeeded":
      case "invoice.payment_failed":
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          customerId = subscription.customer as string;
        }
        break;
      default:
        logStep("Unhandled event type", { eventType: event.type });
        return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    if (!subscription || !customerId) {
      logStep("No subscription or customer found in event");
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Get customer email to find user
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer || customer.deleted || !customer.email) {
      logStep("Customer not found or has no email");
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    logStep("Processing subscription update", {
      customerId,
      subscriptionId: subscription.id,
      status: subscription.status,
      customerEmail: customer.email
    });

    // Find user by email
    const { data: users, error: usersError } = await supabaseClient
      .from("profiles")
      .select("id")
      .ilike("company_name", `%${customer.email}%`)
      .limit(1);

    let userId: string | null = null;

    // If not found in profiles, try to get user by email from auth
    if (!users || users.length === 0) {
      // For webhook, we need to find user differently since we can't use auth.getUser()
      // We'll use the metadata from the checkout session or search by email
      const sessions = await stripe.checkout.sessions.list({
        customer: customerId,
        limit: 1
      });
      
      if (sessions.data.length > 0 && sessions.data[0].metadata?.user_id) {
        userId = sessions.data[0].metadata.user_id;
        logStep("Found user ID from checkout session metadata", { userId });
      }
    } else {
      userId = users[0].id;
      logStep("Found user ID from profiles", { userId });
    }

    if (!userId) {
      logStep("Could not find user for customer", { customerEmail: customer.email });
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Update subscription in database
    const subscriptionUpdate = {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabaseClient
      .from("subscriptions")
      .upsert(subscriptionUpdate, { onConflict: 'user_id' });

    if (updateError) {
      logStep("Error updating subscription", { error: updateError });
      throw updateError;
    }

    logStep("Subscription updated successfully", {
      userId,
      status: subscription.status,
      subscriptionId: subscription.id
    });

    return new Response(JSON.stringify({ received: true }), { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), { status: 400 });
  }
});
