import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const heroName = personalization?.heroName || "Little Hero";
    const storyTitle = order.stories?.title || "Your Magical Storybook";
    
    console.log(`Sending email for hero: ${heroName}, story: ${storyTitle}`);

    // Send email
    console.log(`Sending email to: ${order.user_email}`);
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #fffdf8;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #FF8B00 0%, #FFE97F 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              color: white;
              font-size: 28px;
              font-weight: 700;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 20px;
              font-weight: 600;
              color: #0a0a0a;
              margin-bottom: 20px;
            }
            .message {
              font-size: 16px;
              color: #333;
              margin-bottom: 30px;
            }
            .download-button {
              display: inline-block;
              background: #FF8B00;
              color: white;
              text-decoration: none;
              padding: 16px 40px;
              border-radius: 50px;
              font-weight: 600;
              font-size: 18px;
              margin: 20px 0;
              box-shadow: 0 4px 12px rgba(255, 139, 0, 0.3);
            }
            .download-button:hover {
              background: #e67e00;
            }
            .note {
              background: #fff8e1;
              border-left: 4px solid #FFE97F;
              padding: 15px;
              margin: 20px 0;
              font-size: 14px;
              color: #666;
            }
            .footer {
              text-align: center;
              padding: 30px;
              color: #666;
              font-size: 14px;
              border-top: 1px solid #eee;
            }
            .sparkle {
              font-size: 24px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1><span class="sparkle">✨</span> Your Magical Storybook is Ready! <span class="sparkle">✨</span></h1>
            </div>
            <div class="content">
              <p class="greeting">Dear ${heroName}'s Family,</p>
              <p class="message">
                We're thrilled to let you know that <strong>${heroName}'s</strong> personalized storybook 
                "<strong>${storyTitle}</strong>" has been lovingly crafted and is ready for download!
              </p>
              <p class="message">
                This magical tale was created just for ${heroName}, featuring their unique adventure, 
                favorite things, and beautiful illustrations that bring their story to life.
              </p>
              <center>
                <a href="${order.pdf_url}" class="download-button">
                  📖 Download Your Storybook
                </a>
              </center>
              <div class="note">
                <strong>📅 Important:</strong> Your download link will be available for 7 days. 
                Please save your storybook to your device before it expires.
              </div>
              <p class="message">
                We hope ${heroName} loves their personalized adventure! Share their joy with us by 
                tagging @YourFairyTale on social media.
              </p>
              <p class="message">
                With love and magic,<br>
                <strong>The YourFairyTale.ai Team</strong> 💖
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} YourFairyTale.ai - Where imagination comes to life</p>
              <p>This email was sent to ${order.user_email}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { error: emailError } = await resend.emails.send({
      from: "YourFairyTale.ai <onboarding@resend.dev>",
      to: [order.user_email],
      subject: `✨ Your Magical Storybook is Ready!`,
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
