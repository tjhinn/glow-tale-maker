

## Plan: Use Bold Page Font for Personalized Words in PDF

### Problem
Personalized words currently use the story's **Title Font** (a different font family). The user wants them to use the **same Page Font as the rest of the text, but in bold**.

### Solution
Instead of fetching a separate title font for personalized words, fetch the **Bold variant** of the Page Font and use it for personalized text segments.

Google Fonts stores bold variants as `FontName-Bold.ttf` in the same folder. For example:
- Regular: `ofl/grenze/Grenze-Regular.ttf`
- Bold: `ofl/grenze/Grenze-Bold.ttf`

---

### File: `supabase/functions/compile-storybook-pdf/index.ts`

**Change 1 -- Add a bold font URL helper (around line 307):**
```typescript
function getGoogleFontBoldUrl(fontName: string): string {
  const folderName = fontName.toLowerCase().replace(/\s+/g, '');
  const fileName = fontName.replace(/\s+/g, '') + '-Bold.ttf';
  return `https://raw.githubusercontent.com/google/fonts/main/ofl/${folderName}/${fileName}`;
}
```

**Change 2 -- Batch 1 font loading (lines 339-384):**
- Replace `titleFontUrl` with `pageFontBoldUrl = getGoogleFontBoldUrl(pageFont)`
- Replace the title font fetch and fallback logic with a bold page font fetch
- Fallback: if the Bold variant is not found, reuse the regular page font bytes (so personalized words still render, just without bold)
- Update `boldFont` embedding to use the bold page font bytes

**Change 3 -- Batch 2+ font loading (same pattern):**
Apply the identical change: fetch the bold variant of the page font instead of the title font.

**Change 4 -- Remove unused title font references:**
- Remove `titleFont` variable extraction (no longer needed in this function)
- Remove `bubblegumSansFallbackUrl` (no longer needed)
- Update log messages to say "bold page font" instead of "title font"

**Change 5 -- Update comments:**
Replace all references to "Title font for personalized words" with "Bold page font for personalized words".

---

### Result
| Text Type | Font Used |
|-----------|-----------|
| Regular story text | Page Font Regular (e.g., Grenze Regular) |
| Personalized words | Page Font Bold (e.g., Grenze Bold) |

Both use the same font family, with personalized words standing out via bold weight rather than a completely different typeface.

---

### Testing
1. Go to Admin, then Order Management
2. Click "Regenerate PDF" on an order
3. Verify personalized words (child's name, pet name, city) now appear in the same font as the rest of the text, but bolder
4. Compare with the previous version to confirm visual consistency improvement

