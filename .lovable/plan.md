## Plan: Validate Uploaded Child Photos

### Goal
Before accepting a photo on the Personalize page, verify it actually shows a child and is safe (no NSFW, violence, or off-topic content like screenshots, memes, animals, multiple adults). If it fails, block upload with a clear, friendly message.

### Approach
Use **Lovable AI** (`google/gemini-2.5-flash`, multimodal) via a new edge function. Gemini handles both image understanding and safety classification in a single call — no extra provider or API key needed.

### Flow
```
User selects photo
    ↓
Personalize.tsx uploads to `hero-photos` storage (as today)
    ↓
Calls new edge function `validate-child-photo` with the public URL
    ↓
Edge function asks Gemini:
   - Is the main subject a child (roughly 0–12)?
   - Is the photo safe (no nudity, violence, gore, weapons)?
   - Is it a real photo (not a screenshot, drawing, meme, document)?
   - Is the face clearly visible?
    ↓
Returns { valid: true } OR { valid: false, reason: "..." }
    ↓
If invalid → delete the just-uploaded file, toast the reason, clear photo input
If valid   → proceed as today
```

### Validation Rules (sent as structured output to Gemini)
The model returns JSON:
```ts
{
  isChild: boolean,
  isSafe: boolean,
  isRealPhoto: boolean,
  faceVisible: boolean,
  reason: string  // short, parent-friendly explanation if any check fails
}
```

A photo is accepted only when all four booleans are true.

### Friendly Rejection Messages
The edge function maps failure reasons into kind, on-brand copy:
- Not a child → "Hmm, we couldn't spot a child in this photo. Try one where your little hero is the star! ✨"
- Not safe → "This photo can't be used. Please choose a different one. 💛"
- Not a real photo → "Looks like a drawing or screenshot — please upload a real photo of your child."
- Face not visible → "We need to see your hero's face clearly to bring them into the story!"

### Files to Create / Edit

1. **New: `supabase/functions/validate-child-photo/index.ts`**
   - POST `{ photoUrl: string }` → `{ valid, reason }`
   - Calls Lovable AI Gateway with `google/gemini-2.5-flash` using structured output (Zod schema).
   - Uses `LOVABLE_API_KEY` (already provisioned). CORS headers included.
   - Handles 429 / 402 with clear errors.

2. **Edit: `src/pages/Personalize.tsx`**
   - In `handleContinue`, after the storage upload succeeds:
     - Show "Checking photo…" loading state.
     - `supabase.functions.invoke('validate-child-photo', { body: { photoUrl: originalPhotoUrl } })`.
     - If invalid: delete the uploaded file from `hero-photos`, clear `formData.photo`, toast the friendly reason, stop.
     - If valid: continue to story selection as today.
   - Validation runs on Continue (not on file pick) so we only spend AI credits once the user commits, and we already have the public URL.

### Loading & UX
- Reuse existing toast + Continue button spinner; add "Checking your photo…" subtitle while validating (~2–4s).

### Out of Scope
- No client-side image moderation library (heavier bundle, lower quality than Gemini).
- No retry/appeal flow — user just picks a different photo.
- No admin override (can be added later if false positives become an issue).

### Why Gemini 2.5 Flash
- Multimodal (sees the actual image).
- Built-in safety classifier → catches NSFW reliably.
- Cheap and fast (~1–2s per call).
- Already supported by Lovable AI Gateway → no new secrets.
