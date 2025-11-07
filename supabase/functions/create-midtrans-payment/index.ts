import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    // Send admin notification email
    try {
      await resend.emails.send({
        from: 'YourFairyTale.ai <onboarding@resend.dev>',
        to: ['tjhinn@gmail.com'],
        subject: `🎨 New Order #${order.id.substring(0, 8)} - ${personalizationData.name}'s Storybook`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF8B00;">✨ New Storybook Order Received!</h2>
            
            <div style="background: #FFFDF8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #7A5FFF; margin-top: 0;">Order Details</h3>
              <p><strong>Order ID:</strong> ${order.id}</p>
              <p><strong>Customer Email:</strong> ${userEmail}</p>
              <p><strong>Status:</strong> Pending Payment</p>
            </div>

            <div style="background: #FFE97F20; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #7A5FFF; margin-top: 0;">Hero Details</h3>
              <p><strong>Hero Name:</strong> ${personalizationData.name}</p>
              <p><strong>Gender:</strong> ${personalizationData.gender}</p>
              <p><strong>Pet:</strong> ${personalizationData.petName} (${personalizationData.petType})</p>
              <p><strong>Favorite Color:</strong> ${personalizationData.favoriteColor}</p>
              <p><strong>City:</strong> ${personalizationData.city}</p>
            </div>

            <div style="background: #5BE37D20; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #7A5FFF; margin-top: 0;">Payment Information</h3>
              <p><strong>Amount:</strong> Rp ${amount.toLocaleString('id-ID')}</p>
              <p><strong>Discount Applied:</strong> ${discountApplied ? 'Yes (' + discountCode + ')' : 'No'}</p>
              <p><strong>Currency:</strong> IDR</p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd;">
              <p style="color: #666; font-size: 14px;">
                The customer will complete payment via Midtrans. Once payment is confirmed, 
                the order status will be updated automatically via webhook.
              </p>
            </div>
          </div>
        `,
      });
      console.log("Admin notification email sent successfully");
    } catch (emailError) {
      // Log error but don't fail the order creation
      console.error("Failed to send admin notification email:", emailError);
    }

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
