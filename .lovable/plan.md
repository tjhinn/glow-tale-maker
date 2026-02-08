

## Plan: Use Story Title Font for Personalized Words in PDF

### Problem
Personalized words (hero name, pet name, city, etc.) in the PDF currently use **Bubblegum Sans** (hardcoded). They should instead use the story's **Title Font** -- the same font shown on the cover.

### Solution
Replace the Bubblegum Sans fetch with the story's `title_font` value from the database.

---

### File: `supabase/functions/compile-storybook-pdf/index.ts`

**Change 1 — Add `title_font` to the stories query (line 278-282):**
```typescript
stories (
  title,
  pages,
  page_font,
  title_font
)
```

**Change 2 — Extract title_font after query (around line 296):**
```typescript
const titleFont = story.title_font || 'Bubblegum Sans';
```

**Change 3 — Batch 1 font loading (lines 337-340, 345-348):**
Replace the hardcoded Bubblegum Sans URL with a dynamic URL based on `titleFont`:
```typescript
// Before:
const bubblegumSansUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/bubblegumsans/BubblegumSans-Regular.ttf';

// After:
const titleFontUrl = getGoogleFontUrl(titleFont);
```

Update the parallel fetch and embedding to use `titleFontUrl` instead of `bubblegumSansUrl`, with Bubblegum Sans as fallback if the title font fails.

**Change 4 — Batch 2+ font loading (lines 421, 425-428, 440-443):**
Apply the same change: replace Bubblegum Sans URL with `titleFontUrl` derived from the story's `title_font`.

**Change 5 — Update comments throughout:**
Replace references to "Bubblegum Sans for personalized words" with "Title font for personalized words".

---

### Result
| Text Type | Font Used |
|-----------|-----------|
| Regular story text | Story's Page Font (e.g., Nunito) |
| Personalized words | Story's Title Font (e.g., Bubblegum Sans, or whatever the admin set) |

Each book will have its personalized words rendered in the same font as its cover title, creating visual consistency.

---

### Testing
1. Go to Admin, then Order Management
2. Click "Regenerate PDF" on an existing order
3. Verify personalized words (child's name, pet name, city) use the same font as the cover title
4. Test with a story that has a non-default title font to confirm it works dynamically

