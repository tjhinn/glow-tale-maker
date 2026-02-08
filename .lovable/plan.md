

## Plan: Fix Batch 3 CPU Timeout by Splitting Into Smaller Batches

### Problem
Batch 3 of PDF compilation consistently fails with "CPU Time exceeded." By the time Batch 3 runs, it must:
1. Load a ~19MB partial PDF from storage
2. Re-embed fonts
3. Process 4 more PNG pages (pages 9-12)

This exceeds the Supabase Edge Function CPU time limit.

### Solution
Split the work into **4 batches of 3 pages** instead of 3 batches of 4 pages. This reduces the per-batch workload enough to stay within CPU limits.

| Batch | Current (fails) | New (proposed) |
|-------|-----------------|----------------|
| 1 | Cover + pages 1-4 | Cover + pages 1-3 |
| 2 | Pages 5-8 | Pages 4-6 |
| 3 | Pages 9-12 (CPU EXCEEDED) | Pages 7-9 |
| 4 | n/a | Pages 10-12 |

---

### Files to Modify

#### 1. `supabase/functions/compile-storybook-pdf/index.ts`
- Change `PAGES_PER_BATCH` from `4` to `3`
- Change `TOTAL_BATCHES` from `3` to `4`

#### 2. `src/pages/admin/PageReview.tsx`
- Change `TOTAL_BATCHES` from `3` to `4`
- Update the batch progress indicator text to reflect 4 batches:
  - Batch 1: "Cover + Pages 1-3"
  - Batch 2: "Pages 4-6"
  - Batch 3: "Pages 7-9"
  - Batch 4: "Pages 10-12"

---

### Why This Works
- Each batch processes fewer pages (3 instead of 4)
- The partial PDF loaded in later batches is smaller
- The total number of edge function invocations increases by only 1
- No other code changes needed -- the batch loop in `PageReview.tsx` already iterates dynamically based on `TOTAL_BATCHES`

---

### After Implementation
1. Deploy the updated edge function
2. Go to Admin Dashboard and Order Management
3. Click "Regenerate PDF" on the order
4. All 4 batches should complete successfully

