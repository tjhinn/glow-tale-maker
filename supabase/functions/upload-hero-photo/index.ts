import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

// 90 days — covers admin review window; signed URL refreshable via sign-hero-photo.
const SIGNED_URL_TTL = 60 * 60 * 24 * 90;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { base64, contentType } = await req.json();
    if (typeof base64 !== "string" || !base64) {
      return json({ error: "base64 is required" }, 400);
    }
    if (typeof contentType !== "string" || !ALLOWED_MIME.has(contentType)) {
      return json({ error: "Unsupported image type" }, 400);
    }

    // Strip data URL prefix if present
    const b64 = base64.includes(",") ? base64.split(",")[1] : base64;
    let bytes: Uint8Array;
    try {
      bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    } catch {
      return json({ error: "Invalid base64" }, 400);
    }
    if (bytes.byteLength === 0) return json({ error: "Empty file" }, 400);
    if (bytes.byteLength > MAX_BYTES) return json({ error: "File too large" }, 413);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const ext = EXT_BY_MIME[contentType] ?? "jpg";
    const path = `original-${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("hero-photos")
      .upload(path, bytes, { contentType, upsert: false });
    if (uploadError) {
      console.error("hero-photo upload error", uploadError.message);
      return json({ error: "Upload failed" }, 500);
    }

    const { data: signed, error: signError } = await supabase.storage
      .from("hero-photos")
      .createSignedUrl(path, SIGNED_URL_TTL);
    if (signError || !signed?.signedUrl) {
      console.error("sign error", signError?.message);
      return json({ error: "Could not create signed URL" }, 500);
    }

    return json({ path, signedUrl: signed.signedUrl });
  } catch (err) {
    console.error("upload-hero-photo error", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}