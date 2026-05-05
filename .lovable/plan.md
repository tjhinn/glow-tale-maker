## Plan: Change Checkout Price to $5

### Change
In `src/pages/Checkout.tsx` line 24, update:
```ts
const basePrice = 999; // $9.99 USD in cents
```
to:
```ts
const basePrice = 500; // $5.00 USD in cents
```

This updates the displayed Base Price, Total, and "Pay Securely $X" button on the Checkout page (and the discount math, if a share discount is applied).

### Important caveat
The amount the customer is **actually charged** is controlled by the LemonSqueezy product **variant** (`LEMONSQUEEZY_VARIANT_ID`), not by this code. The `amount` we send is only stored on the order record for our own reference. To actually charge $5, the price must also be updated on the LemonSqueezy variant in the LemonSqueezy dashboard (or a new $5 variant created and the `LEMONSQUEEZY_VARIANT_ID` secret updated).

### Files modified
- `src/pages/Checkout.tsx` — change `basePrice` to `500`
