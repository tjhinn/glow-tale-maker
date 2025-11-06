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
    const notification = await req.json();
    
    const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY");
    if (!MIDTRANS_SERVER_KEY) {
      throw new Error("MIDTRANS_SERVER_KEY is not configured");
    }

    // Verify signature
    const signatureKey = `${notification.order_id}${notification.status_code}${notification.gross_amount}${MIDTRANS_SERVER_KEY}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureKey);
    const hashBuffer = await crypto.subtle.digest("SHA-512", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hash !== notification.signature_key) {
      console.error("Invalid signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    console.log(`Webhook received for order ${orderId}: ${transactionStatus}`);

    let orderStatus = "pending_payment";

    if (transactionStatus === "capture" || transactionStatus === "settlement") {
      if (fraudStatus === "accept") {
        orderStatus = "payment_received";
      }
    } else if (transactionStatus === "cancel" || transactionStatus === "deny" || transactionStatus === "expire") {
      orderStatus = "payment_failed";
    } else if (transactionStatus === "pending") {
      orderStatus = "pending_payment";
    }

    // Update order status
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: orderStatus,
        stripe_payment_intent_id: notification.transaction_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
      throw new Error("Failed to update order");
    }

    console.log(`Order ${orderId} updated to status: ${orderStatus}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in midtrans-webhook function:", error);
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
