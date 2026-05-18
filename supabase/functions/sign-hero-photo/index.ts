import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 90 days
const SIGNED_URL_TTL = 60 * 60 * 24 * 90;

/**
 * Creates a fresh signed URL for an object in the private `hero-photos` bucket.
 * Open endpoint (no JWT) — knowing the storage path is the capability. Paths
 * are random UUIDs so they are effectively unguessable.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { path } = await req.json();
    if (typeof path !== "string" || !path || path.includes("..") || path.startsWith("/")) {
      return json({ error: "Invalid path" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.storage
      .from("hero-photos")
      .createSignedUrl(path, SIGNED_URL_TTL);
    if (error || !data?.signedUrl) {
      return json({ error: "Not found" }, 404);
    }
    return json({ signedUrl: data.signedUrl });
  } catch (err) {
    console.error("sign-hero-photo error", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}