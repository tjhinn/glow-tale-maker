## Plan: Mobile Responsiveness Audit (4.2) + Error Handling (4.4)

Two related polish passes. Mobile first (visual QA + fixes), then a system-wide error-handling layer.

---

## Part A — Mobile Responsiveness Audit (Task 4.2)

### Scope
Audit every customer-facing page at 375×812 (iPhone) and 390×844, plus admin pages at 414×896. Fix any layout, touch target, or readability issues found.

### Audit checklist (run via browser tool at mobile viewports)
Pages to review:
1. `/` — Home (hero, carousel, reviews, CTAs)
2. `/personalize` — multi-step form, photo upload
3. `/choose-story` — StorySelection grid
4. `/preview` — book preview, share/discount button
5. `/checkout` — LemonSqueezy embed
6. `/thank-you` — download CTA
7. `/admin/*` — dashboard, orders, stories, reviews, carousel

For each page check:
- No horizontal scroll at 375px wide
- Touch targets ≥ 44×44px (buttons, icons, links)
- Forms: inputs full-width, labels readable, dropdowns usable
- Images: no overflow, proper aspect ratio
- Text: minimum 14px body, readable line lengths
- Modals/dialogs: fit screen, scrollable content, close button reachable
- Admin tables/cards: stack properly, no truncated critical info

### Likely fixes (will confirm during audit)
- Replace fixed widths with `w-full max-w-*`
- Swap horizontal flex rows to `flex-col sm:flex-row` where they overflow
- Increase small icon-only buttons to min `h-11 w-11`
- Add `overflow-x-auto` to admin tables
- Stack OrderCard action buttons vertically on `<sm`

### Deliverable
Document findings inline in `docs/tasks.md` under Task 4.2 (which screens passed, which got fixes). Apply fixes to identified components only — no blanket rewrites.

---

## Part B — Error Handling Polish (Task 4.4)

### Current state
- `useToast` already wired across all pages
- Most async flows have `try/catch` but error messages are inconsistent (sometimes generic "Something went wrong", sometimes raw error.message, sometimes silent)
- No global handler for unexpected errors
- No retry UX for transient failures (cover generation polling, page generation)

### Changes

**1. Create `src/lib/errorMessages.ts`** — central error mapper
- Translates raw Supabase / fetch / edge function errors into user-friendly copy
- Categories: `network`, `auth`, `payment`, `storage`, `generation_timeout`, `validation`, `unknown`
- Each returns `{ title, description, actionLabel? }`

**2. Create `src/lib/handleError.ts`** — single helper used everywhere
```ts
handleError(error, { context: 'cover_generation', toast })
```
- Logs to console with context
- Calls `errorMessages` mapper
- Fires toast with destructive variant
- Returns the categorized error so callers can branch (e.g. show retry)

**3. Add `<ErrorBoundary>` component** wrapping `<App>` routes
- Catches uncaught render errors
- Shows friendly fallback page with "Try again" + "Back to home"
- Logs error details to console

**4. Update key flows to use the helper:**
- `Personalize.tsx` — photo upload errors (size, format, network)
- `StorySelection.tsx` + `Preview.tsx` — cover generation timeout, polling failure (with explicit retry button, not just toast)
- `Checkout.tsx` — LemonSqueezy load/redirect failures
- `ThankYou.tsx` — PDF signed URL failure (already handled, just normalize)
- `admin/PageReview.tsx` — page generation, batch PDF compilation errors with attempt counter visible
- `admin/OrderActions.tsx` — approve/regenerate errors

**5. Network resilience**
- Add basic retry-with-backoff (up to 2 retries) inside `coverGenerationPolling.ts` for transient fetch failures
- Surface "Still working… (attempt 2 of 3)" in the loading modal so users aren't left guessing

**6. Edge function timeouts**
- `coverGenerationPolling.ts` already has a 3-min window — extend timeout message to suggest "Try again" instead of just failing
- Add explicit handling for `FunctionsHttpError` vs `FunctionsRelayError` vs `FunctionsFetchError` from supabase-js

### Files modified (Part B)
- `src/lib/errorMessages.ts` (new)
- `src/lib/handleError.ts` (new)
- `src/components/ErrorBoundary.tsx` (new)
- `src/App.tsx` (wrap routes)
- `src/pages/Personalize.tsx`
- `src/pages/StorySelection.tsx`
- `src/pages/Preview.tsx`
- `src/pages/Checkout.tsx`
- `src/pages/ThankYou.tsx`
- `src/pages/admin/PageReview.tsx`
- `src/pages/admin/OrderActions.tsx`
- `src/lib/coverGenerationPolling.ts`
- `src/components/story/GenerationLoadingModal.tsx` (show attempt count)
- `docs/tasks.md` (mark 4.2 + 4.4 complete with notes)

---

## Execution order
1. Run the mobile audit with the browser tool (screenshots at 375 and 390 widths) and note issues
2. Apply mobile fixes
3. Build the error-handling primitives (`errorMessages`, `handleError`, `ErrorBoundary`)
4. Refactor the page-level catch blocks to use them
5. Add retry/backoff to polling
6. Update `docs/tasks.md`

### How you'll test after
- Mobile: open the preview at phone size, walk through personalize → story → preview → checkout → admin
- Errors: I'll trigger a known failure (e.g. block a network request via devtools) on cover generation and confirm friendly retry UX appears; force a render error to confirm the boundary catches it
