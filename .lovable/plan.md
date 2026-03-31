

## Plan: Use Bolder Pastel Colors for Favorite Color Dropdown

### Problem
Current colors like Mint (#F5FFFA) and Soft Yellow (#FFFACD) are too washed out and barely visible against a white/light background.

### Change

**`src/pages/Personalize.tsx`** (lines 214-221) and **`src/lib/colorUtils.ts`**: Update hex values to bolder pastels that still feel soft but have enough saturation to pop on light backgrounds.

Updated palette:

| Name | Current | New |
|------|---------|-----|
| Light Pink | #FFB6C1 | #F48FB1 |
| Lavender | #E6E6FA | #B39DDB |
| Mint | #F5FFFA | #80CBC4 |
| Peach | #FFDAB9 | #FFAB91 |
| Sky Blue | #87CEEB | #64B5F6 |
| Soft Yellow | #FFFACD | #FFF176 |
| Light Coral | #F08080 | #E57373 |
| Lilac | #C8A2C8 | #CE93D8 |

### Files modified
- `src/pages/Personalize.tsx` — update hex values in SelectItem swatches
- `src/lib/colorUtils.ts` — update corresponding hex mappings

