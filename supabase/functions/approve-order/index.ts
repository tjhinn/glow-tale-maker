import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(str: string): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

async function requireAdmin(req: Request): Promise<Response | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: roleData } = await userClient
    .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  if (!roleData) {
    return new Response(JSON.stringify({ error: "Forbidden: admin required" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    // Initialize clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "orderId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing approval for order: ${orderId}`);

    // Fetch order with story details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, stories(title)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order fetch error:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate order status
    if (order.status !== "pending_admin_review") {
      return new Response(
        JSON.stringify({ error: `Order status is ${order.status}, must be pending_admin_review` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate PDF exists
    if (!order.pdf_url) {
      return new Response(
        JSON.stringify({ error: "PDF URL not found for this order" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract personalization data
    const personalization = order.personalization_data as any;
    const rawHeroName = personalization?.heroName || "Little Hero";
    const heroName = escapeHtml(rawHeroName);

    // Replace personalization placeholders in any string (e.g. story title)
    const replacePlaceholders = (text: string) => {
      if (!text) return text;
      return text
        .replace(/{heroName}/g, escapeHtml(personalization?.heroName || ""))
        .replace(/{petName}/g, escapeHtml(personalization?.petName || ""))
        .replace(/{petType}/g, escapeHtml(personalization?.petType || ""))
        .replace(/{favoriteColor}/g, escapeHtml(personalization?.favoriteColor || ""))
        .replace(/{favoriteFood}/g, escapeHtml(personalization?.favoriteFood || ""))
        .replace(/{city}/g, escapeHtml(personalization?.city || ""));
    };

    const storyTitle = replacePlaceholders(
      order.stories?.title || "Your Magical Storybook"
    );

    console.log(`[Order ${orderId}] Enqueuing branded order-ready email`);

    const { error: emailError } = await supabase.functions.invoke(
      "send-transactional-email",
      {
        body: {
          templateName: "order-ready",
          recipientEmail: order.user_email,
          idempotencyKey: `order-ready-${orderId}`,
          templateData: {
            heroName: rawHeroName,
            storyTitle,
            pdfUrl: order.pdf_url,
          },
        },
      }
    );

    if (emailError) {
      console.error("Email send error:", emailError);
      return new Response(
        JSON.stringify({ error: `Failed to send email: ${emailError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Order-ready email enqueued");

    // Update order status
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "email_sent",
        email_sent_at: now,
        admin_approved_at: now,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Order update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update order status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Order ${orderId} approved and email sent successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order approved and email sent successfully",
        orderId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
