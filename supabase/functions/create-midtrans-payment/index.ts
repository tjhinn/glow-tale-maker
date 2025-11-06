import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  userEmail: string;
  amount: number;
  discountApplied: boolean;
  discountCode?: string;
  personalizationData: any;
  storyId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, amount, discountApplied, discountCode, personalizationData, storyId }: PaymentRequest = await req.json();

    const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY");
    if (!MIDTRANS_SERVER_KEY) {
      throw new Error("MIDTRANS_SERVER_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create order in database first
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_email: userEmail,
        amount_paid: amount,
        discount_applied: discountApplied,
        discount_code: discountCode || null,
        personalization_data: personalizationData,
        story_id: storyId,
        status: "pending_payment",
        currency: "idr",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      throw new Error("Failed to create order");
    }

    console.log("Order created:", order.id);

    // Create Midtrans Snap transaction
    const midtransAuth = btoa(MIDTRANS_SERVER_KEY + ":");
    const snapResponse = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${midtransAuth}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: order.id,
          gross_amount: amount,
        },
        customer_details: {
          email: userEmail,
        },
        item_details: [
          {
            id: storyId,
            price: amount,
            quantity: 1,
            name: "Personalized Storybook",
          },
        ],
      }),
    });

    if (!snapResponse.ok) {
      const errorText = await snapResponse.text();
      console.error("Midtrans API error:", snapResponse.status, errorText);
      throw new Error(`Midtrans API error: ${snapResponse.status}`);
    }

    const snapData = await snapResponse.json();
    console.log("Midtrans Snap token created:", snapData.token);

    return new Response(
      JSON.stringify({
        orderId: order.id,
        snapToken: snapData.token,
        redirectUrl: snapData.redirect_url,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in create-midtrans-payment function:", error);
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
