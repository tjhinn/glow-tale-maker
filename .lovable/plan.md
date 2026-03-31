

## Plan: Update Personalization Form Inputs

### Changes

#### 1. Remove Favorite Food field
- **`src/pages/Personalize.tsx`**: Remove `favoriteFood` from state, the input field, and the data saved to localStorage
- **`src/pages/admin/OrderCard.tsx`**: Remove the favoriteFood display block
- Keep `{favoriteFood}` placeholder handling in all other files (edge functions, Preview, Checkout, etc.) — they already default to empty string via `|| ''`, so existing stories using the placeholder will just render blank. No breakage.

#### 2. Replace Pet Type text input with dropdown
- **`src/pages/Personalize.tsx`**: Replace the `<Input>` for petType with a `<Select>` dropdown containing: Dog, Cat, Rabbit, Bear, Bird, Hamster

#### 3. Replace Favorite Color text input with pastel color dropdown
- **`src/pages/Personalize.tsx`**: Replace the `<Input>` for favoriteColor with a `<Select>` dropdown showing pastel color options (e.g., Light Pink, Lavender, Mint, Peach, Sky Blue, Soft Yellow, Light Coral, Lilac)
- **`src/lib/colorUtils.ts`**: Ensure these pastel names map to appropriate hex values (add any missing entries)

### Files modified
- `src/pages/Personalize.tsx` — all 3 changes
- `src/pages/admin/OrderCard.tsx` — remove food display
- `src/lib/colorUtils.ts` — add pastel color mappings if missing

