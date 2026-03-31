

## Plan: Make Story Magic Section a 2-Column Grid

The Story Magic section stacks Hometown and Favorite Color vertically (`space-y-4`), making it 4 lines tall. The Magical Companion section uses a `grid grid-cols-1 md:grid-cols-2` layout, making it 2 lines.

### Change

**`src/pages/Personalize.tsx`** (lines 199-223): Replace the `space-y-4` wrapper div with the same `grid grid-cols-1 md:grid-cols-2 gap-4` layout used by Magical Companion, placing Hometown and Favorite Color side by side on desktop.

