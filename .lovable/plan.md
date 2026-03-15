

## Plan: Replace Bubblegum Sans with Fredoka Everywhere

### Overview
Replace all instances of "Bubblegum Sans" with "Fredoka" across the website code, and update all 4 story templates in the database to use Fredoka for both `title_font` and `page_font`.

### Code Changes

**1. `index.html`** — Update Google Fonts import
- Change comment and font URL from `Bubblegum+Sans` to `Fredoka:wght@300;400;500;600;700`

**2. `tailwind.config.ts`** — Update heading font family
- Change `heading: ['Bubblegum Sans', 'cursive']` → `heading: ['Fredoka', 'cursive']`

**3. `src/index.css`** — Update comment
- Change "Bubblegum Sans" reference to "Fredoka"

**4. `src/lib/flattenCoverWithTitle.ts`** — Update default font and fallbacks
- Default parameter: `'Bubblegum Sans'` → `'Fredoka'`
- Canvas font fallbacks: `"Bubblegum Sans", cursive` → `"Fredoka", cursive`

**5. `src/pages/StorySelection.tsx`** — Update fallbacks
- Line 60: fallback `'Bubblegum Sans'` → `'Fredoka'`
- Line 151: fallback `'Bubblegum Sans'` → `'Fredoka'`
- Line 309: inline style `'Bubblegum Sans', cursive` → `'Fredoka', cursive`

**6. `src/pages/Preview.tsx`** — Update fallback
- Line 220: `'Bubblegum Sans'` → `'Fredoka'`

**7. `src/pages/AdminStories.tsx`** — Update defaults and placeholder
- Lines 50, 284, 302: default `title_font` from `'Bubblegum Sans'` → `'Fredoka'`
- Line 494: placeholder text update

### Database Update
Update all 4 story templates to use Fredoka for both fonts:
```sql
UPDATE stories SET title_font = 'Fredoka', page_font = 'Fredoka';
```

### Summary of Scope
- 7 files modified
- 1 database update (all stories)
- No structural/schema changes needed

