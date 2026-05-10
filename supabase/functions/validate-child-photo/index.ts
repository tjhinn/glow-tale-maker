const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidationResult {
  isChild: boolean;
  isSafe: boolean;
  isRealPhoto: boolean;
  faceVisible: boolean;
  reason: string;
}

function friendlyReason(r: ValidationResult): string {
  if (!r.isSafe) return "This photo can't be used. Please choose a different one. 💛";
  if (!r.isRealPhoto) return "Looks like a drawing or screenshot — please upload a real photo of your child.";
  if (!r.isChild) return "Hmm, we couldn't spot a child in this photo. Try one where your little hero is the star! ✨";
  if (!r.faceVisible) return "We need to see your hero's face clearly to bring them into the story!";
  return r.reason || "Please try a different photo.";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { photoUrl } = await req.json();
    if (!photoUrl || typeof photoUrl !== "string") {
      return new Response(JSON.stringify({ error: "photoUrl required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a strict content reviewer for a children's storybook app. Parents upload a photo of their child to be turned into an illustrated character. Evaluate the photo and respond with JSON only.`;

    const userPrompt = `Evaluate this uploaded photo against four criteria. Be strict but fair.

Return ONLY a JSON object (no markdown, no prose) matching:
{
  "isChild": boolean,    // true if the main subject is clearly a child roughly aged 0-12
  "isSafe": boolean,     // false if any nudity, sexual content, violence, gore, weapons, or disturbing imagery
  "isRealPhoto": boolean,// true only for real photographs. false for drawings, cartoons, screenshots, memes, documents, AI-generated images
  "faceVisible": boolean,// true if the child's face is clearly visible and not heavily obscured
  "reason": string       // brief explanation if any of the above is false; empty string if all true
}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: photoUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      console.error("AI gateway error", aiRes.status, text);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Photo check is busy, please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Photo validation is temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway ${aiRes.status}: ${text}`);
    }

    const data = await aiRes.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: ValidationResult;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      // Fail-open to avoid blocking real users on a parse error
      return new Response(JSON.stringify({ valid: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const valid = !!(parsed.isChild && parsed.isSafe && parsed.isRealPhoto && parsed.faceVisible);
    const result = valid
      ? { valid: true }
      : { valid: false, reason: friendlyReason(parsed) };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("validate-child-photo error", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});