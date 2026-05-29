## Goal
Make the `/stories` page load fast by serving small, CDN-cached cover thumbnails instead of the original 5–10 MB PNGs. Original story template files in the `story-images` bucket stay untouched (they're still used for book generation).

## Change (single file: `src/pages/StorySelection.tsx`)

1. **Story grid covers** (around line 276) — switch from plain `getPublicUrl()` to the transform variant:
   ```ts
   const { data } = supabase.storage.from('story-images').getPublicUrl(coverUrl, {
     transform: { width: 600, height: 600, resize: 'cover', quality: 75 }
   });
   coverUrl = `${data.publicUrl}&t=${new Date(story.updated_at).getTime()}`;
   ```
   (Note `&t=` because the transform URL already has query params.)

2. **Hero avatar** (line 246) — `personalization.personalizedCoverUrl` is already a personalized cover from `order-images` (smaller), so leave it alone unless we also want to shrink it. Recommendation: skip — it's a single image and already personalized/flattened.

3. **Lazy/async hints** on the `<img>` tags in the grid (line 288–292):
   ```tsx
   <img src={coverUrl} ... loading="lazy" decoding="async" />
   ```

## How it works
- Each unique `(path, width, quality)` combo is transformed once by Supabase, then served from the global CDN edge cache for every future visitor.
- Originals in the bucket are never modified — admin/PDF flows keep using full-resolution files.
- Expected page weight: ~27 MB → under 1 MB.

## Validation
- Reload `/stories`, check Network tab: cover requests should be ~50–150 KB WebP/JPEG and return from CDN on second load.
- Confirm admin dashboard and PDF generation still use the original full-size PNGs (they do — they read `cover_image_url` directly, not through the transform).

## Fallback
If transforms return 400 (image transformation not enabled on the plan), revert this one file and switch to the one-time re-encode script approach.
