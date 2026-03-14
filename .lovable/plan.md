

## Plan: Increase Left and Right Margins of Text Box in PDF Pages

### Problem
The text inside the white transparent box on PDF story pages sits too close to the left and right edges of the box.

### Current Values
- `textBoxX = 40` (box starts 40px from page edge)
- `textBoxWidth = image.width - 80` (80px total horizontal margin for the box)
- `maxTextWidth = textBoxWidth - 40` (only 20px inner padding on each side of text within the box)

The inner padding of 20px per side is too tight.

### Solution
Increase the inner text padding from 40px total to 80px total (40px per side), giving the text more breathing room inside the box.

### File: `supabase/functions/compile-storybook-pdf/index.ts`

**Line 169** -- Change `maxTextWidth` calculation:
```typescript
// Before:
const maxTextWidth = textBoxWidth - 40;

// After:
const maxTextWidth = textBoxWidth - 80;
```

This doubles the inner padding from 20px to 40px on each side of the text within the white box, while keeping the box itself the same size.

### Testing
1. Go to Admin, then Order Management
2. Click "Regenerate PDF" on an order
3. Open the resulting PDF and verify the text has more space from the left and right edges of the white box

