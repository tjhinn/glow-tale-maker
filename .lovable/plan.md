

## Plan: Fix Personalized Text Color in PDF

### Problem
The `colorNameToRgb` function in `compile-storybook-pdf/index.ts` (line 78-92) only maps 10 basic color names (red, blue, green, etc.) and defaults to dark blue `(0.2, 0.2, 0.8)` for anything unrecognized. The app's 13-color palette uses compound names like "Light Pink", "Bold Purple", "Dark Orange" that are not in this map, so every personalized word renders in dark blue regardless of the user's choice.

### Solution
Replace the `colorNameToRgb` function with a complete map matching all 13 dropdown options plus a hex-parsing fallback for any hex value that might be passed directly.

### Changes

**`supabase/functions/compile-storybook-pdf/index.ts`** -- replace `colorNameToRgb` with:

| Color Name | Hex | RGB (0-1) |
|---|---|---|
| bold red | #C62828 | (0.776, 0.157, 0.157) |
| light coral | #E57373 | (0.898, 0.451, 0.451) |
| light pink | #F48FB1 | (0.957, 0.561, 0.694) |
| peach | #FFAB91 | (1.0, 0.671, 0.569) |
| dark orange | #E65100 | (0.902, 0.318, 0.0) |
| light green | #81C784 | (0.506, 0.780, 0.518) |
| dark green | #2E7D32 | (0.180, 0.490, 0.196) |
| mint | #80CBC4 | (0.502, 0.796, 0.769) |
| sky blue | #64B5F6 | (0.392, 0.710, 0.965) |
| dark blue | #1565C0 | (0.082, 0.396, 0.753) |
| lavender | #B39DDB | (0.702, 0.616, 0.859) |
| lilac | #CE93D8 | (0.808, 0.576, 0.847) |
| bold purple | #7B1FA2 | (0.482, 0.122, 0.635) |

Add a hex fallback: if the value starts with `#`, parse it directly to RGB. Keep the dark blue default only as a last resort.

### Files modified
- `supabase/functions/compile-storybook-pdf/index.ts` -- replace `colorNameToRgb` with full 13-color palette + hex parser

