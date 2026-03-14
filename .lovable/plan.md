

## Plan: 3-Column Grid Layout for Order Cards

### Changes

**File: `src/pages/AdminOrders.tsx`** (line 253)
- Change the grid from single-column to a responsive 3-column layout:
```typescript
// Before:
<div className="grid gap-6">

// After:
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
```

**File: `src/pages/admin/OrderCard.tsx`**
- Make the card content more compact for the narrower column width:
  - Reduce padding in CardHeader and CardContent
  - Change personalization details grid from 2 columns to 1 column
  - Use smaller text sizes throughout (text-sm → text-xs where appropriate)
  - Simplify the info sections to take less vertical space
  - Stack the "Story" and "Amount Paid" fields vertically instead of side-by-side grid

This will show 1 card per row on mobile, 2 on medium screens, and 3 on large screens, making the order list much easier to browse.

