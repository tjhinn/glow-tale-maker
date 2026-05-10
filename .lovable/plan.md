## Plan: Fix Sticky Share Discount Bug (Minimum Approach)

### Problem
`localStorage.shareDiscount` is only cleared in `ThankYou.tsx` after a successful purchase. If a user abandons the flow at any point after sharing, the discount persists. When they start a new storybook, they see the discount already applied on Preview/Checkout with no option to share again.

### Solution
Clear `localStorage.shareDiscount` at the start of every new order flow so each storybook begins fresh.

### Changes

1. **`src/pages/Personalize.tsx`**
   - Add a `useEffect` on component mount that removes `shareDiscount` (and `orderId` as a safety net) from `localStorage`.
   - This ensures the discount is reset when the user lands on the first step of personalization.

2. **`src/pages/StorySelection.tsx`**
   - Add a `useEffect` on component mount that removes `shareDiscount` from `localStorage`.
   - This acts as a secondary safety net if the user navigates directly to story selection.

### Technical Details
- No new dependencies.
- No backend changes.
- `ThankYou.tsx` already clears these keys after 5 seconds — that behavior remains unchanged.
