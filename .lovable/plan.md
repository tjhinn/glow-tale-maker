

## Plan: Update Favorite Color Options with Gradient Sequencing

### Changes

Remove Soft Yellow, add 5 new colors, and reorder all 12 options from warm→cool→deep in a natural gradient sequence.

**Ordered palette:**

| # | Color | Hex |
|---|-------|-----|
| 1 | Bold Red | #C62828 |
| 2 | Light Coral | #E57373 |
| 3 | Light Pink | #F48FB1 |
| 4 | Peach | #FFAB91 |
| 5 | Dark Orange | #E65100 |
| 6 | Light Green | #81C784 |
| 7 | Dark Green | #2E7D32 |
| 8 | Mint | #80CBC4 |
| 9 | Sky Blue | #64B5F6 |
| 10 | Dark Blue | #1565C0 |
| 11 | Lavender | #B39DDB |
| 12 | Lilac | #CE93D8 |
| 13 | Bold Purple | #7B1FA2 |

### Files modified
- `src/pages/Personalize.tsx` — replace SelectItem list with reordered 13 colors, remove Soft Yellow
- `src/lib/colorUtils.ts` — remove `soft yellow`, add `dark orange`, `light green`, `dark green`, `dark blue`, `bold purple`, `bold red`

