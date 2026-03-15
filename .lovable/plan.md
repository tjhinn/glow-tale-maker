

## Plan: Delete All Orders and Related Storage Files

### What will be done
Delete all 4 orders from the database and clean up their associated files from storage buckets, while preserving story templates.

### Steps

1. **Clean up storage buckets** — Call the existing `cleanup-orphaned-storage` edge function (which already preserves story template folders in `story-images`) to delete files from:
   - `order-images` (all order-specific generated pages)
   - `hero-photos` (uploaded/illustrated hero photos)
   - `generated-pdfs` (compiled PDF files)
   - Orphaned folders in `story-images` (only non-template folders)

2. **Delete all 4 orders from the database**:
   - `0b7aa2a6-1ac6-4291-9c84-3f6a54de3fa0`
   - `ae345469-74b5-4da4-9a00-354a1e72b65a`
   - `b6e610c5-fa1f-48b0-9ed8-017b7a3a4293`
   - `861ef155-5c09-4af9-8b6a-df90ab35df13`

### Safety
- The cleanup function explicitly preserves story template folders by checking against the `stories` table
- Orders will be deleted via `DELETE FROM orders` — no other tables are affected (no foreign key dependencies from orders)

