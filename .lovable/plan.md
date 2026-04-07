

## Plan: Fix PDF Font Crash (`Cannot read properties of undefined reading 'tag'`)

### Problem
The ligature-stripped fonts uploaded to storage (`fredoka-500-noliga.ttf`, `fredoka-600-noliga.ttf`) have corrupted OpenType GSUB tables. When `fontkit` tries to do text layout via `widthOfTextAtSize`, it crashes because `selectScript` finds an undefined entry in the broken GSUB table.

The fonts load and embed successfully (36KB each), but crash at text layout time — which is why the error occurs on page 1 after the cover renders fine (cover uses Canvas API, not pdf-lib text layout).

### Root Cause
Stripping the `liga` feature from the font likely left dangling references in the GSUB table structure, causing fontkit to hit `undefined.tag`.

### Solution
Remove the broken noliga font files (Priority 0) from the fallback chain entirely. Instead, prevent ligature issues at the **text level** by inserting a Unicode Zero-Width Non-Joiner (U+200C) between character pairs that form ligatures (`fi`, `fl`, `ff`, `ffi`, `ffl`). This tells the font engine not to merge those characters, achieving the same result as stripping ligatures from the font — without corrupting font tables.

### Changes

**`supabase/functions/compile-storybook-pdf/index.ts`**:

1. **Remove Priority 0** (lines ~347-360): Delete the entire noliga font block from `fetchFontWithFallbacks`. Fontsource CDN (Priority 2) becomes the effective source for Fredoka.

2. **Add a text sanitizer function** that breaks ligature sequences:
```typescript
function breakLigatures(text: string): string {
  return text
    .replace(/ffi/g, 'f\u200Cfi')
    .replace(/ffl/g, 'f\u200Cfl')
    .replace(/ff/g, 'f\u200Cf')
    .replace(/fi/g, 'f\u200Ci')
    .replace(/fl/g, 'f\u200Cl');
}
```

3. **Apply `breakLigatures`** to text before `widthOfTextAtSize` (line ~206) and `drawText` calls in `addStoryPage`.

### Files modified
- `supabase/functions/compile-storybook-pdf/index.ts` — remove noliga font priority, add ligature-breaking text sanitizer

