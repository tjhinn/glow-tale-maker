## Problem

Clicking **Pay Securely** returns a 400 from `create-lemonsqueezy-checkout` with `"Invalid input"`. The edge function never reaches LemonSqueezy because zod validation fails before the API call.

## Root cause

`Personalize.tsx` saves the hero photo under the key **`heroPhotoUrl`**:

```ts
const personalizationData = {
  heroName, gender, petType, petName, favoriteColor, city,
  heroPhotoUrl: originalPhotoUrl,   // ← stored as heroPhotoUrl
  heroPhotoPath: uploadedFilePath,
};
localStorage.setItem("personalizationData", JSON.stringify(personalizationData));
```

But `Checkout.tsx` only looks for `originalPhotoUrl` or the legacy `photoUrl`:

```ts
const paymentData = {
  ...personalizationData,
  originalPhotoUrl: personalizationData.originalPhotoUrl || personalizationData.photoUrl,
};
```

So `originalPhotoUrl` is `undefined`, the request body fails the zod check in `create-lemonsqueezy-checkout` (`originalPhotoUrl: z.string().url()`), and the function returns `400 {error: "Invalid input"}`. The frontend only shows the generic toast, hiding the real reason.

## Fix

1. In `src/pages/Checkout.tsx`, extend the fallback chain to include the actual key used today:
   ```ts
   originalPhotoUrl:
     personalizationData.originalPhotoUrl ||
     personalizationData.heroPhotoUrl ||
     personalizationData.photoUrl,
   ```
2. Surface the real backend error message in the toast so future validation failures are diagnosable: when the function returns a JSON `error`/`details`, include `details[0]` in the thrown message instead of the generic "Failed to open secure checkout."

No edge-function or schema changes are needed — the checkout function's validation is correct; the client was sending the wrong field name.

## Verification

- Reproduce on `/checkout` with a real personalization in localStorage; clicking **Pay Securely** should redirect to LemonSqueezy.
- Check `create-lemonsqueezy-checkout` logs show `[Order …] Created` instead of returning 400.
