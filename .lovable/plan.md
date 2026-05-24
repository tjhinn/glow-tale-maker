## Make hero & pet insertion conditional on template content

Some story page templates intentionally have no child character or animal (close-ups, environment-only scenes). The current AI prompt forces the model to "replace the generic hero" and "replace any existing companion animal", which causes it to insert a character/pet into pages where none should appear.

Update the prompts in both page-generation edge functions so the AI **detects first, then conditionally personalizes**.

### Files to change
1. `supabase/functions/generate-single-page/index.ts` (admin single-page regeneration)
2. `supabase/functions/auto-generate-pages/index.ts` (background bulk generation)

Both share nearly identical prompt construction — apply the same change to both so behavior stays consistent.

### Prompt changes

Restructure the prompt with an explicit detection step up front:

- **New "DETECT FIRST" section** at the top of the task:
  - Inspect the template page (Image 1) and decide:
    - Does it contain a generic child character? (yes/no)
    - Does it contain a companion animal? (yes/no)
  - This determines what to personalize — never add a character or animal that isn't already in the template.

- **CHARACTER REPLACEMENT** section becomes **conditional**:
  - *If* a child character exists in the template → replace with personalized hero (existing instructions).
  - *If no* child character exists (close-up of an object, scenery, hands, etc.) → leave the scene as-is. **Do NOT insert the hero.** Preserve the template exactly.

- **PET COMPANION REPLACEMENT** section becomes **conditional**:
  - *If* a companion animal exists in the template → replace with personalized pet.
  - *If no* animal exists → do NOT add one, even if the user provided a pet name/type.

- **COLOR ACCENTS** stays as-is (subtle environmental accents are fine on any page).

- Reinforce in **WHAT TO PRESERVE**: if the template has no hero/pet, the output should be visually identical to the template (still re-rendered for consistency, but no inserted figures).

### Out of scope
- No DB schema changes (no per-page "has_hero"/"has_pet" flags). Relying on the model's vision to detect is simpler and matches how the existing prompt already inspects the template.
- No UI changes.
- Cover generation is unaffected — cover always features hero + pet by design.

### How to test
1. Regenerate a page from a template that has no child (e.g. the Cloud Painter spread or Moonlight Library close-up) via Admin → Order → Generate page.
2. Confirm output preserves the template without inserting the hero/pet.
3. Regenerate a page that does feature a child + animal — confirm personalization still works as before.
