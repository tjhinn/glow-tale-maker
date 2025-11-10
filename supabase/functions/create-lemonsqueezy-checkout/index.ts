import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

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
  personalizationData: {
    childName: string;
    gender: string;
    petSpecies: string;
    petName: string;
    favoriteColor: string;
    favoriteFood: string;
    city: string;
    photoUrl: string;
  };
  storyId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paymentRequest: PaymentRequest = await req.json();

    // Get environment variables
    const LEMONSQUEEZY_API_KEY = Deno.env.get("LEMONSQUEEZY_API_KEY");
    const LEMONSQUEEZY_STORE_ID = Deno.env.get("LEMONSQUEEZY_STORE_ID");
    const LEMONSQUEEZY_VARIANT_ID = Deno.env.get("LEMONSQUEEZY_VARIANT_ID");

    if (!LEMONSQUEEZY_API_KEY || !LEMONSQUEEZY_STORE_ID || !LEMONSQUEEZY_VARIANT_ID) {
      throw new Error("LemonSqueezy configuration is incomplete");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_email: paymentRequest.userEmail,
        story_id: paymentRequest.storyId,
        personalization_data: paymentRequest.personalizationData,
        amount_paid: paymentRequest.amount,
        discount_applied: paymentRequest.discountApplied,
        discount_code: paymentRequest.discountCode,
        currency: "usd",
        status: "pending_payment",
        payment_provider: "lemonsqueezy",
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
        from: "YourFairyTale <onboarding@resend.dev>",
        to: ["admin@yourfairytale.ai"],
        subject: `New Order Received - ${order.id}`,
        html: `
          <h2>New Storybook Order</h2>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Customer Email:</strong> ${paymentRequest.userEmail}</p>
          <p><strong>Amount:</strong> $${(paymentRequest.amount / 100).toFixed(2)} USD</p>
          <p><strong>Discount Applied:</strong> ${paymentRequest.discountApplied ? "Yes" : "No"}</p>
          <hr>
          <h3>Personalization Details:</h3>
          <ul>
            <li><strong>Child Name:</strong> ${paymentRequest.personalizationData.childName}</li>
            <li><strong>Gender:</strong> ${paymentRequest.personalizationData.gender}</li>
            <li><strong>Pet:</strong> ${paymentRequest.personalizationData.petName} (${paymentRequest.personalizationData.petSpecies})</li>
            <li><strong>Favorite Color:</strong> ${paymentRequest.personalizationData.favoriteColor}</li>
            <li><strong>Favorite Food:</strong> ${paymentRequest.personalizationData.favoriteFood}</li>
            <li><strong>City:</strong> ${paymentRequest.personalizationData.city}</li>
          </ul>
        `,
      });
      console.log("Admin notification email sent");
    } catch (emailError) {
      console.error("Failed to send admin email:", emailError);
      // Don't fail the order if email fails
    }

    // Create LemonSqueezy checkout session
    const checkoutPayload = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: paymentRequest.userEmail,
            custom: {
              order_id: order.id,
            },
          },
          product_options: {
            redirect_url: `${req.headers.get("origin")}/thank-you?order_id=${order.id}`,
          },
          checkout_options: {
            discount: false,
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: LEMONSQUEEZY_STORE_ID,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: LEMONSQUEEZY_VARIANT_ID,
            },
          },
        },
      },
    };

    console.log("Creating LemonSqueezy checkout...");
    const lemonSqueezyResponse = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        "Authorization": `Bearer ${LEMONSQUEEZY_API_KEY}`,
      },
      body: JSON.stringify(checkoutPayload),
    });

    if (!lemonSqueezyResponse.ok) {
      const errorText = await lemonSqueezyResponse.text();
      console.error("LemonSqueezy API error:", errorText);
      throw new Error(`LemonSqueezy API error: ${lemonSqueezyResponse.status}`);
    }

    const lemonSqueezyData = await lemonSqueezyResponse.json();
    const checkoutUrl = lemonSqueezyData.data.attributes.url;

    console.log("LemonSqueezy checkout created:", checkoutUrl);

    return new Response(
      JSON.stringify({
        orderId: order.id,
        checkoutUrl: checkoutUrl,
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
    console.error("Error in create-lemonsqueezy-checkout function:", error);
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
