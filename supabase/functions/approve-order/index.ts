import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

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
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

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

    console.log(`[Order ${orderId}] Sending approval email`);

    // Send email
    console.log(`[Order ${orderId}] Dispatching to recipient`);
    
    const headingFont = "'Fredoka', 'Trebuchet MS', 'Comic Sans MS', sans-serif";
    const bodyFont = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${heroName}'s storybook has arrived</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        </head>
        <body style="margin:0;padding:0;background-color:#FFFDF8;font-family:${bodyFont};color:#0A0A0A;line-height:1.6;">
          <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
            ✨ ${heroName}'s very own fairy tale is ready to read tonight.
          </div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFFDF8;padding:32px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(255,139,0,0.12);">
                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#FF8B00 0%,#FFB347 50%,#FFE97F 100%);padding:48px 32px;text-align:center;">
                      <div style="font-size:32px;line-height:1;margin-bottom:12px;">✨ 📖 ✨</div>
                      <h1 style="margin:0;font-family:${headingFont};font-size:30px;font-weight:600;color:#FFFFFF;letter-spacing:-0.5px;text-shadow:0 2px 8px rgba(0,0,0,0.12);">
                        ${heroName}'s Story is Ready
                      </h1>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px 36px 16px 36px;">
                      <p style="margin:0 0 20px;font-size:18px;font-weight:600;color:#0A0A0A;font-family:${headingFont};">
                        Hi there 👋
                      </p>
                      <p style="margin:0 0 18px;font-size:16px;color:#333;line-height:1.65;">
                        Something magical just happened. <strong>${heroName}'s</strong> very own fairy tale —
                        <em style="color:#7A5FFF;">"${storyTitle}"</em> — has been lovingly illustrated, page by page,
                        and is ready to be read tonight.
                      </p>
                      <p style="margin:0 0 28px;font-size:16px;color:#333;line-height:1.65;">
                        Every sparkle, every brushstroke, every word — made just for ${heroName}.
                      </p>

                      <!-- Sparkle divider -->
                      <div style="text-align:center;margin:8px 0 24px;color:#7A5FFF;letter-spacing:8px;font-size:14px;">
                        ✦ ✦ ✦
                      </div>
                      <p style="margin:0 0 28px;text-align:center;font-style:italic;color:#7A5FFF;font-size:15px;">
                        Turn the page — the magic begins…
                      </p>
                    </td>
                  </tr>

                  <!-- CTA -->
                  <tr>
                    <td align="center" style="padding:0 36px 32px;">
                      <a href="${order.pdf_url}"
                         style="display:inline-block;background-color:#FF8B00;color:#FFFFFF !important;text-decoration:none;padding:18px 44px;border-radius:50px;font-weight:600;font-size:18px;font-family:${headingFont};box-shadow:0 6px 20px rgba(255,139,0,0.35);">
                        📖 Open ${heroName}'s Storybook
                      </a>
                    </td>
                  </tr>

                  <!-- Info note -->
                  <tr>
                    <td style="padding:0 36px 32px;">
                      <div style="background-color:#FFF8E1;border-left:4px solid #FFE97F;border-radius:8px;padding:16px 18px;font-size:14px;color:#5C5043;line-height:1.55;">
                        <strong style="color:#0A0A0A;">📅 Save the magic.</strong>
                        Your download link will be available for <strong>1 month</strong>.
                        Save the storybook to your device so ${heroName} can revisit the adventure anytime.
                      </div>
                    </td>
                  </tr>

                  <!-- Sign-off -->
                  <tr>
                    <td style="padding:0 36px 40px;">
                      <p style="margin:0;font-size:16px;color:#333;line-height:1.65;">
                        With love and a little bit of magic, ✨<br>
                        <strong style="font-family:${headingFont};color:#0A0A0A;">The YourFairyTale.ai Team</strong>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#FFFDF8;padding:24px 36px;border-top:1px solid #F0E9DC;text-align:center;">
                      <p style="margin:0 0 6px;font-size:12px;color:#999;font-family:${headingFont};">
                        ✨ YourFairyTale.ai — where imagination comes to life ✨
                      </p>
                      <p style="margin:0;font-size:11px;color:#B5B5B5;">
                        © ${new Date().getFullYear()} YourFairyTale.ai · Sent to ${order.user_email}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const { error: emailError } = await resend.emails.send({
      from: "ArtBookMagic <noreply@artbookmagic.com>",
      to: [order.user_email],
      subject: `✨ ${rawHeroName}'s storybook has arrived`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      return new Response(
        JSON.stringify({ error: `Failed to send email: ${emailError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully");

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
