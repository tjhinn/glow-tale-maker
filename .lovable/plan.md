

## Plan: Add Color Swatches to Favorite Color Dropdown

### Change

**`src/pages/Personalize.tsx`** (lines 213-222): Add a small colored square (`div`) next to each color name in the `SelectItem` elements using inline styles with the hex values from the color mapping.

Each `SelectItem` will render a flex row with a 16×16 rounded square showing the actual color, followed by the color name. Example:

```tsx
<SelectItem value="Light Pink">
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 rounded-sm border border-gray-200" style={{ backgroundColor: '#FFB6C1' }} />
    Light Pink
  </div>
</SelectItem>
```

Colors: Light Pink (#FFB6C1), Lavender (#E6E6FA), Mint (#F5FFFA), Peach (#FFDAB9), Sky Blue (#87CEEB), Soft Yellow (#FFFACD), Light Coral (#F08080), Lilac (#C8A2C8).

### Files modified
- `src/pages/Personalize.tsx` — add color swatch divs to each SelectItem

