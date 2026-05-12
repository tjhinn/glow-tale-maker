import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const cutoff = new Date(Date.now() - 120 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("orders")
      .delete()
      .eq("status", "pending_payment")
      .lt("created_at", cutoff)
      .select("id");

    if (error) throw error;

    const deleted = data?.length ?? 0;
    console.log(`[cleanup-pending-orders] deleted ${deleted} stale pending_payment orders (older than ${cutoff})`);

    return new Response(JSON.stringify({ deleted }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("[cleanup-pending-orders] error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});