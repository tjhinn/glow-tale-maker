I'm using knowledge

## Plan: Fix Remaining PDF Page Spacing Errors

### What’s actually causing it
The current fix in `supabase/functions/compile-storybook-pdf/index.ts` inserts `U+200C` between `fi/fl/ff/...` via `breakLigatures()`. In Fredoka with `pdf-lib/fontkit`, that character is not behaving like a harmless zero-width separator, so words render with visible gaps like `f ix`, `puf fed`, `f lowers`, and `f lutt ered`.

The cover does not have this problem because `src/lib/flattenCoverWithTitle.ts` already draws text character-by-character on canvas instead of sending whole word runs through the font layout engine.

### Implementation
1. **Remove the current ligature workaround**
   - Delete `breakLigatures()`.
   - Stop modifying page text with zero-width characters.
   - Keep only whitespace cleanup.

2. **Switch page text rendering to character-by-character**
   - In `compile-storybook-pdf`, add helpers to:
     - measure text by summing single-character widths
     - draw text one character at a time
   - Use these helpers for both normal text and highlighted personalized words.

3. **Make line measurement match rendering exactly**
   - Replace `font.widthOfTextAtSize(segment.text + ' ', ...)` with:
     - word width measured from characters
     - space width handled separately
   - Only add spaces between words, not after the last word on a line.
   - This keeps centering accurate and removes hidden spacing drift.

4. **Keep the font-weight fix**
   - Leave the working Fontsource 500/600 fallback chain in place.
   - No new font uploads or storage work are needed.

5. **Fix the project source of truth**
   - Update `docs/tasks.md` so it no longer says the ligature-free uploaded fonts are the finished solution.
   - Replace that note with the final per-character rendering fix once implemented.

### Technical details
- Drawing characters individually prevents ligature substitution without corrupting font files or injecting control characters.
- This follows the same successful rendering pattern already used for cover typography.
- A small width cache can be added for repeated characters to keep PDF generation efficient.

### QA after implementation
Regenerate the same storybook and verify these render cleanly:
- `fix`
- `puffed`
- `floating`
- `flowers`
- `butterflies`
- `finally`
- `fluffy`
- `followed`

Also confirm:
- personalized words still stay bold/colored
- lines remain properly centered
- no PDF compilation crashes return

### Files to modify
- `supabase/functions/compile-storybook-pdf/index.ts`
- `docs/tasks.md`