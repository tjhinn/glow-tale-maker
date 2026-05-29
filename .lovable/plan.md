I agree your screenshots contradict the earlier interpretation: the dashboard summary clearly shows SHARE20 as Active, All products, 20%, and your product page shows the product itself as Published.

Plan to resolve this without guessing:

1. Re-query LemonSqueezy live API using the configured project secret
   - Confirm which environment the API key is connected to.
   - Fetch the store, product 1086894, discount SHARE20, and product variants.
   - Compare the API fields against what your dashboard screenshots show.

2. Check the exact checkout payload used by the app
   - Confirm which variant ID the app sends to LemonSqueezy.
   - Confirm whether the app passes SHARE20 as a discount code or discount ID.
   - Confirm the checkout is created under the same store/product/variant as your dashboard.

3. Explain the dashboard/API mismatch clearly
   - For variants: LemonSqueezy single-variant products often do not expose a clickable variant URL in the dashboard; the default variant can exist only in the API, so the URL staying at `/products/1086894` is not unusual.
   - For SHARE20: if the API still rejects the selected variant while the dashboard says All products, then the issue is likely one of these: stale LemonSqueezy saved state, a mismatch between the checkout variant and the visible product, or the app is using a different checkout/discount parameter than expected.

4. If needed, prepare a minimal app-side fix
   - Add temporary safe diagnostics around checkout creation so we can see product ID, variant ID, discount code, store ID, and LemonSqueezy response without logging secrets or personal data.
   - Remove those diagnostics after the cause is confirmed.