

## Plan: Make "Meet Your Hero" Section a 2-Column Grid

Same fix as the other sections — wrap Child's Name and Gender inputs in a `grid grid-cols-1 md:grid-cols-2 gap-4` layout so they sit side-by-side on desktop.

### Change

**`src/pages/Personalize.tsx`** (lines 141-157): Replace the two stacked `space-y-2` divs with a single `grid grid-cols-1 md:grid-cols-2 gap-4` wrapper, placing Child's Name and Gender side by side.

