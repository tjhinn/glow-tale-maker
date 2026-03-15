

## Plan: Fix Thin Fredoka Font in PDF Story Pages

### Problem
Fredoka is a variable font. The current code tries to load `Fredoka-Regular.ttf` (doesn't exist at root level), falls back to the variable font `Fredoka[wdth,wght].ttf`, and `pdf-lib` renders it at the lightest weight (300) since it cannot select a specific weight from variable fonts. The website uses Fredoka at weight ~500 (medium), so the PDF text looks noticeably thinner.

### Solution
Update the font URL helpers to also try Google Fonts' **static subdirectory** where pre-built single-weight files exist (e.g., `static/Fredoka-Medium.ttf`, `static/Fredoka-SemiBold.ttf`). Use **Medium (500)** for regular text and **SemiBold (600)** for personalized/bold text to match the website's visual weight.

### Changes

**`supabase/functions/compile-storybook-pdf/index.ts`**:

Update `fetchFontWithFallbacks` to try static weight-specific files before falling back to variable fonts:

- For `regular` variant: try `static/{FontName}-Medium.ttf` first, then `{FontName}-Regular.ttf`, then variable fonts
- For `bold` variant: try `static/{FontName}-SemiBold.ttf` first, then `{FontName}-Bold.ttf`, then variable fonts

This ensures Fredoka (and other fonts with static subdirectories) loads at the correct weight, while preserving the existing fallback chain for fonts that use different file structures.

