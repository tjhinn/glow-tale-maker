

## Plan: Compress Images During PDF Compilation

### Problem
Pages are stored as full-resolution PNGs (~2-4MB each). The PDF edge function fetches and embeds them at full size, causing CPU timeouts.

### Approach
Convert PNG images to JPEG and resize them during PDF compilation, before embedding. We'll use the **ImageMagick**-style approach available in Deno — specifically, we can re-encode images by drawing them onto an OffscreenCanvas... but Deno doesn't support Canvas APIs.

**Better approach**: Convert the images at the point they're generated and uploaded. In `generate-single-page/index.ts`, the AI-generated composited image is already returned as base64. Currently it's uploaded as PNG. We can convert it to JPEG at upload time, which will reduce file sizes by ~70-80% with minimal quality loss (quality 90).

However, the composited image comes from the AI model as a base64 data URL — we don't have canvas APIs in Deno to re-encode. Instead, we should **compress during PDF compilation** by scaling down the images when embedding them.

**Simplest effective fix**: In `compile-storybook-pdf`, scale down images to a target size (e.g., 1200px wide) when adding them to the PDF. `pdf-lib` already supports drawing images at any size — we just need to set a max dimension rather than using the full native resolution.

### Changes

**`supabase/functions/compile-storybook-pdf/index.ts`**:
- In `addStoryPage()`, after embedding the image, calculate scaled dimensions with a max width of 1200px (sufficient for print quality at storybook size)
- Use the scaled dimensions for the page size and `drawImage` call instead of the native `image.width` / `image.height`
- Same scaling for the cover page

This means the PDF pages will be 1200px wide instead of whatever the native resolution is (likely 2048px+), dramatically reducing the PDF size and CPU time for `pdfDoc.save()`.

**Also reduce batch size as a safety measure**:
- `PAGES_PER_BATCH`: 3 → 2
- `TOTAL_BATCHES`: 4 → 6
- Update `src/pages/admin/PageReview.tsx` and `src/pages/AdminOrders.tsx` to match

