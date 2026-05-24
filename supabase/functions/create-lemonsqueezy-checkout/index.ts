import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_ORIGINS = new Set<string>([
  "https://your-fairy-tale.lovable.app",
  "https://artbookmagic.com",
  "https://www.artbookmagic.com",
]);
const DEFAULT_ORIGIN = "https://artbookmagic.com";

const getSiteOrigin = (req: Request) => {
  const origin = req.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) return origin;
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (ALLOWED_ORIGINS.has(refOrigin)) return refOrigin;
    } catch (_error) {
      // ignore
    }
  }
  return DEFAULT_ORIGIN;
};

function escapeHtml(str: string): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

const paymentRequestSchema = z.object({
  userEmail: z.string().trim().email().max(254),
  amount: z.number().int().positive().max(999999),
  discountApplied: z.boolean(),
  discountCode: z.string().max(50).optional(),
  storyId: z.string().uuid(),
  personalizationData: z.object({
    heroName: z.string().trim().min(1).max(50),
    gender: z.string().max(20),
    petType: z.string().max(30).optional().default(""),
    petName: z.string().max(30).optional().default(""),
    favoriteColor: z.string().max(30).optional().default(""),
    favoriteFood: z.string().max(50).optional().default(""),
    city: z.string().max(80).optional().default(""),
    originalPhotoUrl: z.string().url().max(2048),
    personalizedCoverUrl: z.string().url().max(2048).optional(),
  }),
});

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
    const rawBody = await req.json();
    const parsed = paymentRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          details: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }
    const paymentRequest = parsed.data as unknown as PaymentRequest;

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

    console.log(`[Order ${order.id}] Created`);

    // Send admin notification email
    try {
      const p = paymentRequest.personalizationData;
      await resend.emails.send({
        from: "ArtBookMagic <noreply@artbookmagic.com>",
        to: ["tjhinn@gmail.com"],
        subject: `New Order Received - ${order.id}`,
        html: `
          <h2>New Storybook Order</h2>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Customer Email:</strong> ${escapeHtml(paymentRequest.userEmail)}</p>
          <p><strong>Amount:</strong> $${(paymentRequest.amount / 100).toFixed(2)} USD</p>
          <p><strong>Discount Applied:</strong> ${paymentRequest.discountApplied ? "Yes" : "No"}</p>
          <hr>
          <h3>Personalization Details:</h3>
          <ul>
            <li><strong>Hero Name:</strong> ${escapeHtml(p.heroName)}</li>
            <li><strong>Gender:</strong> ${escapeHtml(p.gender)}</li>
            <li><strong>Pet:</strong> ${escapeHtml(p.petName)} (${escapeHtml(p.petType)})</li>
            <li><strong>Favorite Color:</strong> ${escapeHtml(p.favoriteColor)}</li>
            <li><strong>Favorite Food:</strong> ${escapeHtml(p.favoriteFood)}</li>
            <li><strong>City:</strong> ${escapeHtml(p.city)}</li>
          </ul>
        `,
      });
      console.log(`[Order ${order.id}] Admin notification email sent`);
    } catch (emailError) {
      console.error("Failed to send admin email:", emailError);
      // Don't fail the order if email fails
    }

    const siteOrigin = getSiteOrigin(req);

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
            redirect_url: `${siteOrigin}/thank-you?order_id=${order.id}`,
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
      try {
        const parsed = JSON.parse(errorText);
        const detail = parsed?.errors?.[0]?.detail;
        if (typeof detail === "string" && detail.length > 0) {
          friendly = `LemonSqueezy checkout setup error: ${detail}`;
        }
      } catch (_error) {
        // Keep the status-only fallback if LemonSqueezy returns non-JSON.
      }
      if (lemonSqueezyResponse.status === 401) {
        friendly =
          "LemonSqueezy rejected the API key (401 Unauthenticated). Please paste a fresh API key from LemonSqueezy → Settings → API into the LEMONSQUEEZY_API_KEY secret. Make sure you copy the full token (it's a long string starting with 'ey') and that it belongs to the same store as the configured Store ID.";
      }
      throw new Error(friendly);
    }

    const lemonSqueezyData = await lemonSqueezyResponse.json();
    const checkoutUrl = lemonSqueezyData.data.attributes.url;

    console.log(`[Order ${order.id}] LemonSqueezy checkout created`);

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
