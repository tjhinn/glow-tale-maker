

## Plan: Add "Clear Error" Button to Order Error Alerts

### Problem
The `error_log` column in the orders table retains old error messages even after the root cause has been fixed. The `OrderErrorAlert` component displays any non-null `error_log`, so stale errors persist in the UI.

### Solution
Add a "Clear Error" button directly on the `OrderErrorAlert` component that sets `error_log` to `null` in the database without changing the order status. This lets admins dismiss resolved errors.

### Changes

**`src/pages/admin/OrderErrorAlert.tsx`**:
- Add an `onClear` callback prop and a "Clear" / "Dismiss" button inside the alert
- Keep it minimal — a small icon button or text link

**`src/pages/AdminOrders.tsx`**:
- Create a `handleClearError` function that updates `error_log` to `null` for the given order and refetches
- Pass it as `onClear` to `OrderErrorAlert`

