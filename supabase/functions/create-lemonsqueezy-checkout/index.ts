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
  personalizationData: {
    heroName: string;
    gender: string;
    petType: string;
    petName: string;
    favoriteColor: string;
    favoriteFood: string;
    city: string;
    originalPhotoUrl: string;
    personalizedCoverUrl?: string;
  };
  storyId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paymentRequest: PaymentRequest = await req.json();

    // Get environment variables (trim to defend against accidental whitespace/newlines)
    const LEMONSQUEEZY_API_KEY = Deno.env.get("LEMONSQUEEZY_API_KEY")?.trim();
    const LEMONSQUEEZY_STORE_ID = Deno.env.get("LEMONSQUEEZY_STORE_ID")?.trim();
    const LEMONSQUEEZY_VARIANT_ID = Deno.env.get("LEMONSQUEEZY_VARIANT_ID")?.trim();

    if (!LEMONSQUEEZY_API_KEY || !LEMONSQUEEZY_STORE_ID || !LEMONSQUEEZY_VARIANT_ID) {
      throw new Error("LemonSqueezy configuration is incomplete");
    }

    // Safe diagnostics — never logs the secret itself
    const keyLen = LEMONSQUEEZY_API_KEY.length;
    const looksLikeJwt = LEMONSQUEEZY_API_KEY.split(".").length === 3;
    const startsWithEy = LEMONSQUEEZY_API_KEY.startsWith("ey");
    console.log(
      `[LS] key_len=${keyLen} looks_like_jwt=${looksLikeJwt} starts_with_ey=${startsWithEy} store_id=${LEMONSQUEEZY_STORE_ID} variant_id=${LEMONSQUEEZY_VARIANT_ID}`,
    );
    if (!looksLikeJwt || !startsWithEy) {
      console.warn(
        "[LS] LEMONSQUEEZY_API_KEY does not look like a LemonSqueezy API key (expected a long JWT-like token starting with 'ey'). Got length " +
          keyLen,
      );
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
        hero_photo_url: paymentRequest.personalizationData.originalPhotoUrl,
        personalized_cover_url: paymentRequest.personalizationData.personalizedCoverUrl,
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
            <li><strong>Hero Name:</strong> ${paymentRequest.personalizationData.heroName}</li>
            <li><strong>Gender:</strong> ${paymentRequest.personalizationData.gender}</li>
            <li><strong>Pet:</strong> ${paymentRequest.personalizationData.petName} (${paymentRequest.personalizationData.petType})</li>
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
            discount_code: paymentRequest.discountCode,
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
      let friendly = `LemonSqueezy API error: ${lemonSqueezyResponse.status}`;
      if (lemonSqueezyResponse.status === 401) {
        friendly =
          "LemonSqueezy rejected the API key (401 Unauthenticated). Please paste a fresh API key from LemonSqueezy → Settings → API into the LEMONSQUEEZY_API_KEY secret. Make sure you copy the full token (it's a long string starting with 'ey') and that it belongs to the same store as the configured Store ID.";
      }
      throw new Error(friendly);
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
