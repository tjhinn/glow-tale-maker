import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("LEMONSQUEEZY_WEBHOOK_SECRET is not configured");
    }

    // Get the signature from headers
    const signature = req.headers.get("X-Signature");
    if (!signature) {
      console.error("Missing X-Signature header");
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get the raw body for signature verification
    const rawBody = await req.text();
    
    // Verify signature using HMAC-SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(webhookSecret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
    
    const dataToVerify = encoder.encode(rawBody);
    const expectedSignatureBuffer = await crypto.subtle.sign("HMAC", key, dataToVerify);
    const expectedSignature = Array.from(new Uint8Array(expectedSignatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (expectedSignature !== signature) {
      console.error("Invalid signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Parse the webhook payload
    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;
    
    console.log(`LemonSqueezy webhook received: ${eventName}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract order ID from custom data
    const customData = payload.meta?.custom_data;
    const orderId = customData?.order_id;

    if (!orderId) {
      console.error("No order_id found in webhook payload");
      return new Response(JSON.stringify({ error: "Missing order_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Handle different webhook events
    let orderStatus = "pending_payment";
    
    if (eventName === "order_created") {
      orderStatus = "payment_received";
      console.log(`Payment successful for order ${orderId}`);
      
      // Update order in database
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: orderStatus,
          payment_provider_id: payload.data?.id,
          payment_transaction_id: payload.data?.attributes?.identifier,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("Error updating order:", updateError);
        throw new Error("Failed to update order");
      }

      console.log(`Order ${orderId} updated to status: ${orderStatus}`);
      console.log(`Admin should manually start page generation from the Orders dashboard`);
      
    } else if (eventName === "order_refunded") {
      orderStatus = "refunded";
      console.log(`Refund processed for order ${orderId}`);
      
      // Update order in database
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: orderStatus,
          payment_provider_id: payload.data?.id,
          payment_transaction_id: payload.data?.attributes?.identifier,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("Error updating order:", updateError);
        throw new Error("Failed to update order");
      }

      console.log(`Order ${orderId} updated to status: ${orderStatus}`);
      
    } else {
      console.log(`Unhandled event: ${eventName}`);
      return new Response(JSON.stringify({ success: true, message: "Event not processed" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in lemonsqueezy-webhook function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
