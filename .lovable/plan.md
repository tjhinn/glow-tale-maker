

## Plan: Fix Thin Font Weight in PDF Page Text

### Problem
Fredoka has no static weight files on the Google Fonts GitHub repo -- only a variable font `Fredoka[wdth,wght].ttf`. When pdf-lib embeds this variable font, it renders at the default (lightest) weight (~300), making text appear thin. The cover text looks fine because it uses the Canvas API which handles variable font weights natively.

### Root Cause
In `compile-storybook-pdf/index.ts`, the `fetchFontWithFallbacks` function tries:
1. Static `static/Fredoka-Medium.ttf` -- **404** (no static folder exists)
2. Static `Fredoka-Regular.ttf` / `Fredoka-Bold.ttf` -- **404**
3. Variable `Fredoka[wdth,wght].ttf` -- **found**, but renders at minimum weight

### Solution
Add a new priority in the fallback chain: try **Fontsource CDN** static weight TTFs before falling through to the variable font. Fontsource provides individual weight files:
- Regular (Medium 500): `https://cdn.jsdelivr.net/fontsource/fonts/fredoka@latest/latin-500-normal.ttf`
- Bold (SemiBold 600): `https://cdn.jsdelivr.net/fontsource/fonts/fredoka@latest/latin-600-normal.ttf`

This approach is **generic** -- it works for any Google Font, not just Fredoka. The fallback chain becomes:

1. Google Fonts GitHub static files (e.g. `static/FontName-Medium.ttf`)
2. **Fontsource CDN weight-specific TTFs** (new)
3. Google Fonts GitHub standard static files (`FontName-Regular.ttf`)
4. Variable font (last resort)

### Change

**`supabase/functions/compile-storybook-pdf/index.ts`** -- In the `fetchFontWithFallbacks` function (~line 343), insert a new priority step between the static GitHub attempt and the standard Regular/Bold attempt. This adds Fontsource CDN URLs:

```
// New priority: Fontsource CDN static weight files
const weight = variant === 'bold' ? '600' : '500';
const fontsourceName = fontName.toLowerCase().replace(/\s+/g, '-');
const fontsourceUrl = `https://cdn.jsdelivr.net/fontsource/fonts/${fontsourceName}@latest/latin-${weight}-normal.ttf`;
```

### Files modified
- `supabase/functions/compile-storybook-pdf/index.ts` -- add Fontsource CDN fallback in `fetchFontWithFallbacks`

