## Update tasks.md to reflect current state

### Changes

**1. Update "Current State" block (around line 304)**

Replace:
```
- 📚 Database: 1 active story ("The Sky Garden" - gender: both)
```
with:
```
- 📚 Database: 4 active stories (all gender: both)
  - {heroName} and The Sky Garden
  - {heroName}'s Journey Beyond the Stars
  - {heroName} and the Moonlight Library
  - {heroName}, the Cloud Painter
```

**2. Update "Next Steps" lists (lines 309-314 and 1687-1693)**

Remove the stale "Add more stories to database (need stories for boy/girl genders)" item — all 4 stories already use `hero_gender: 'both'`, which covers every child.

Reorder remaining next steps so the live priorities surface first:
- End-to-end flow testing (Task 4.1)
- Animation & polish (Task 4.3)

**3. Add a new "Recent Updates" entry at the top (2026-05-10)** documenting the recent fixes so future sessions don't re-derive them:
- Share-discount stale-state fix on Personalize/StorySelection
- New `validate-child-photo` edge function (Gemini 2.5 Flash multimodal)
- Tasks.md story-count correction

**4. Refresh the trailing "Last Updated" footer** to `2026-05-10`.

### Out of scope
- No code changes.
- No DB changes — DB is already correct; only the doc was stale.
