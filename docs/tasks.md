# YourFairyTale.ai - Implementation Tasks

> **Platform:** Lovable Cloud  
> **Updated:** 2025-11-07  
> **Status:** Ready for implementation  
> **Workflow:** Manual quality check after payment → Admin approval → Customer email delivery

> **Note:** This implementation plan uses Lovable Cloud, which provides native database, storage, authentication, and serverless functions. All code examples use the standard Supabase client syntax since Lovable Cloud is built on Supabase infrastructure. No external Supabase account or dashboard access is required—all backend management happens within Lovable.

---

## 🎯 Recent Updates (2026-03-14)

**Increase Text Box Inner Margins in PDF - COMPLETED:**
- ✅ Increased left/right inner padding of text box from 20px to 40px per side
- ✅ Updated `maxTextWidth` calculation in `compile-storybook-pdf` (subtracted 80 instead of 40)
- ✅ Edge function redeployed

**Use Bold Page Font for Personalized Words in PDF - COMPLETED:**
- ✅ Personalized words now use the **Bold variant** of the Page Font (same family, bold weight)
- ✅ Added `getGoogleFontBoldUrl()` helper to fetch `-Bold.ttf` from Google Fonts
- ✅ Fallback to regular page font if bold variant unavailable
- ✅ Removed separate title font fetching for personalized words
- ✅ Applied to both Batch 1 and Batch 2+ font loading paths
- ✅ Edge function redeployed

---

## Previous Updates (2026-02-08)

**Use Story Title Font for Personalized Words in PDF - COMPLETED:**
- ✅ Updated `compile-storybook-pdf` to fetch `title_font` from stories table
- ✅ Personalized words (hero name, pet, city) now use the story's Title Font instead of hardcoded Bubblegum Sans
- ✅ Added fallback to Bubblegum Sans if title font is unavailable
- ✅ Applied to both Batch 1 and Batch 2+ font loading paths
- ✅ Edge function redeployed

**Fix Batch 3 CPU Timeout - COMPLETED:**
- ✅ Split PDF compilation from 3 batches of 4 pages to 4 batches of 3 pages
- ✅ Updated edge function, PageReview.tsx, and AdminOrders.tsx

**Fix Expired PDF Preview URLs - COMPLETED:**
- ✅ Created shared utility `src/lib/pdfSignedUrl.ts` for on-demand signed URL generation
- ✅ Updated OrderCard.tsx "Preview PDF" link to generate fresh 1-hour signed URLs
- ✅ Updated OrderActions.tsx "Download PDF" button to use same pattern
- ✅ Expired signed URLs no longer cause InvalidJWT errors

---

## Previous Updates (2026-01-26)

**Per-Story Page Font Customization - COMPLETED:**
- ✅ Added `page_font` column to stories table (default: 'Inter')
- ✅ Added "Page Font" input field in Admin Story Template form (below Title Color)
- ✅ Updated Story interface, formData, resetForm, handleEdit, create/update mutations
- ✅ Updated compile-storybook-pdf edge function to dynamically load page font from Google Fonts
- ✅ Added fallback to Inter if custom font is unavailable
- ✅ Each storybook can now have unique typography for inside pages
- ✅ Recommended fonts: Nunito, Quicksand, Comfortaa, Baloo 2, Varela Round

---

## Previous Updates (2026-01-25)

**Order Dashboard Button Improvements - COMPLETED:**
- ✅ Replaced "Force Regenerate" button with two distinct options
- ✅ Added "Regenerate PDF" button - keeps approved images, recompiles PDF only (for text/styling changes)
- ✅ Added "Regenerate Pages" button - clears all images and resets to start fresh
- ✅ Updated layout: "Approve & Send" on its own row, regeneration buttons side-by-side below
- ✅ "Regenerate Pages" styled with destructive variant to indicate more drastic action
- ✅ Added loading states for PDF regeneration process
- ✅ Updated for both `pending_admin_review` and `approved`/`email_sent` statuses

---

## Previous Updates (2026-01-24)

**Title Color Customization - COMPLETED:**
- ✅ Added `title_color` column to stories table (default: #FFFFFF)
- ✅ Updated Story interface and form state in AdminStories.tsx
- ✅ Added color picker input in Admin Story Template form
- ✅ Updated create/update mutations to include title_color
- ✅ Updated flattenCoverWithTitle.ts to accept titleColor parameter
- ✅ Updated StorySelection.tsx to pass story's title_color to flattening function
- ✅ Default color changed to golden yellow (#FFD700) for new stories

**Cover Title Font Styling Tweaks - COMPLETED:**
- ✅ Reduced white outline thickness from 8px to 4px for cleaner look
- ✅ Strengthened drop shadow (opacity 0.6→0.85, blur 4→8, offset 2→4)
- ✅ Added 10% edge safety margins to prevent title overflow
- ✅ Implemented automatic font scaling for long titles
- ✅ Moved title position from 8% to 12% from top for better spacing

**Typography Overhaul - Bubblegum Sans - COMPLETED:**
- ✅ Replaced all decorative/heading fonts (Wonderia, Playfair Display, Poppins, Fredoka One) with Bubblegum Sans
- ✅ Inter retained for body text only
- ✅ Updated Google Fonts import in index.html
- ✅ Updated tailwind.config.ts with new `font-heading` class
- ✅ Removed Wonderia @font-face from index.css and deleted Wonderia.otf font file
- ✅ Updated all pages: Home, Personalize, StorySelection, Preview, Checkout, ThankYou, NotFound
- ✅ Updated admin pages: AdminDashboard, AdminStories, AdminReviews
- ✅ Updated flattenCoverWithTitle.ts to use Bubblegum Sans from Google Fonts CDN
- ✅ Updated compile-storybook-pdf edge function to use Bubblegum Sans for PDF text
- ✅ Edge function deployed successfully

**Typography Overhaul - Fredoka Replacement - COMPLETED:**
- ✅ Replaced Bubblegum Sans with Fredoka across all code (index.html, tailwind.config.ts, index.css, flattenCoverWithTitle.ts)
- ✅ Updated all page fallbacks: StorySelection, Preview, AdminStories
- ✅ Updated all 4 story templates in database: both title_font and page_font set to Fredoka
- ✅ Updated stories table defaults to Fredoka for both title_font and page_font

---

## Previous Updates (2026-01-20)

**Background Job Queue for Cover Generation - COMPLETED:**
- ✅ Created `cover_generation_jobs` table for async processing
- ✅ Modified `generate-character-illustration` to return immediately with job ID
- ✅ Created `check-cover-status` edge function for polling job status
- ✅ Created `src/lib/coverGenerationPolling.ts` with polling utilities
- ✅ Updated StorySelection.tsx and Preview.tsx to use polling pattern
- ✅ Eliminates gateway timeout errors - client polls instead of waiting on long connection
- ✅ Generation now works reliably (~60s AI processing with 3-minute polling window)

---

## Previous Updates (2026-01-09)

**Admin Story Editor UX Improvements - COMPLETED:**
- ✅ Simplified story page editor with horizontal compact layout
- ✅ Removed nested scroll areas (now single dialog scroll)
- ✅ Reduced page image to 80×64px thumbnails (no cropping, object-contain)
- ✅ Reduced cover image previews to 160px wide
- ✅ All 12 pages visible with much less scrolling

---

## Previous Updates (2026-01-07)

**Cover Image Flattening Fix - COMPLETED:**
- ✅ Fixed CORS issues by fetching cover images as blobs before canvas drawing
- ✅ Added retry logic (2 attempts) for flattening failures
- ✅ Added upload verification to confirm flattened cover was saved
- ✅ Better error logging throughout the flattening process
- ✅ Ensured localStorage is properly updated before navigation

**PDF Batch Compilation - COMPLETED:**
- ✅ Added `pdf_batch_progress` column to orders table
- ✅ Split PDF compilation into 3 batches to avoid CPU timeout:
  - Batch 1: Cover + Pages 1-4
  - Batch 2: Pages 5-8
  - Batch 3: Pages 9-12, finalize and upload
- ✅ Partial PDFs saved to storage between batches
- ✅ Resume capability if a batch fails (retry from last completed batch)
- ✅ Progress indicator shows current batch during compilation
- ✅ Edge function `compile-storybook-pdf` updated with batch parameter

---

## Previous Updates (2025-11-25)

**Phase 0 Foundation - COMPLETED:**
- ✅ User roles system with `has_role()` security definer function
- ✅ RLS policies on user_roles table (INSERT, UPDATE, DELETE, SELECT)
- ✅ Admin user seeded (tjhinn@gmail.com - UUID: 54d2d627-2f23-469b-9e74-d18c155b800f)
- ✅ Auto-confirm email signups enabled
- ✅ Storage bucket RLS policies (hero-photos: public, generated-pdfs: admin-only)
- ✅ Field name standardization (heroName, petType) across all components and edge functions

**Phase 1 Frontend - COMPLETED:**
- ✅ Personalize.tsx with photo upload and data persistence
- ✅ StorySelection.tsx with character illustration generation
- ✅ Preview.tsx with Web Share API and discount logic
- ✅ Checkout.tsx with LemonSqueezy integration
- ✅ ThankYou.tsx with order confirmation
- ✅ **NEW:** Personalized story scene illustration with full scene composition (hero in costume, pet companion, favorite food)
- ✅ **NEW:** Redesigned Preview page with prominent single-image showcase

**Phase 2 Backend - COMPLETED:**
- ✅ All edge functions deployed and operational
- ✅ Edge function imports fixed (@2.79.0 → @2)
- ✅ Character illustration generation working
- ✅ **NEW:** Scene illustration generation with story-themed costumes and full composition
- ✅ PDF generation with composited images
- ✅ Email delivery system functional

**Phase 3 Admin - MOSTLY COMPLETED:**
- ✅ Admin authentication and role verification
- ✅ Story management CRUD
- ✅ Carousel management
- ⏳ Orders dashboard (needs testing)

**Bugfixes:**
- ✅ Story cover image URL resolution fixed (2025-11-12)
- ✅ Edge function import errors resolved (2025-11-25)
- ✅ Personalization placeholders showing as literal text fixed (2025-11-25)
- ✅ Illustration regeneration on story change implemented (2025-11-25)
- ✅ Character illustration prompt updated to prevent text overlay (2025-11-25)
- ✅ Personalized book cover generation implemented (2025-11-26)
  - Database migration: illustrated_hero_url → personalized_cover_url
  - Edge function updated to edit story cover with child's likeness, pet, and personalized title typography
  - Multi-image AI input for base cover editing
  - All related code updated across 6 files
- ✅ Edge function generation failures fixed (2025-11-27)
  - AI model corrected: google/gemini-2.5-flash-image-preview → google/gemini-3-pro-image-preview
  - Enhanced error logging with full response details (status, body, page context)
  - Error persistence to database with attempt counter
  - Automatic error_log clearing on generation start
  - Status reset to payment_received for retry capability
- ✅ Webhook timeout on first-run generation fixed (2025-11-28)
  - Removed auto-generation trigger from LemonSqueezy webhook
  - Webhook now returns 200 immediately after updating order status
  - Admin manually starts page generation from Orders dashboard
  - Eliminates false timeout errors and gives admin full control over generation timing
- ✅ Facial expression and pose variety added to page generation (2025-11-30)
  - Updated prompt to allow natural expression variation based on story context
  - Changed position constraint from "same pose" to "approximately same LOCATION"
  - Added explicit instructions for contextually appropriate expressions (curious, happy, determined, etc.)
  - Added emotional context guidance based on page number and narrative moment
  - Enables dynamic, engaging illustrations with natural body language variation
- ✅ Fixed double title on PDF cover (2025-11-30)
  - Removed duplicate title overlay from generate-storybook edge function
  - Cover now displays only the styled title from flattenCoverWithTitle.ts
  - Eliminated plain Times Roman Bold title that was appearing over the beautiful Fredoka One title
- ✅ Enhanced storybook text for children (2025-11-30)
  - Increased base font size from 16px to 24px for easy reading
  - Embedded Poppins font (Regular & Bold) from Google Fonts to match webapp
  - Personalized words (name, pet, city, etc.) are now 28px, bold, and colored with child's favorite color
  - Increased line height to 36px and text box to 220px for better readability
  - Implemented segment-based rendering to highlight personalized content dynamically
- ✅ Fixed compile-storybook-pdf typography and double title (2025-11-30)
  - Updated compile-storybook-pdf edge function to match generate-storybook typography
  - Removed duplicate title overlay on PDF cover
  - Embedded Poppins fonts (Regular & Bold) for child-friendly text
  - Implemented personalized word highlighting with favorite color
  - Updated font sizes: base 24px, personalized 28px, line height 36px
- ✅ Fixed PDF font embedding error (2025-11-30)
  - Replaced broken Google Fonts static URLs with GitHub raw URLs
  - Fixed "Unknown font format" error during PDF compilation
  - Added error handling for font loading with response status checks
  - Fonts now load successfully: Poppins-Regular.ttf and Poppins-Bold.ttf from github.com/google/fonts
- ✅ Improved PDF typography (2025-11-30)
  - Increased font sizes: base 28px, personalized 32px, line height 42px
  - Reduced white box height from 220px to 160px
  - Implemented center-justified text (horizontal centering)
  - Added vertical centering with balanced white space
  - Two-pass rendering algorithm: calculate lines, then center and render
- ✅ Fixed "Generate All" button state persistence (2025-11-30)
  - Added `isGeneratingAll` state to track batch operations
  - Button now shows "Generating..." throughout entire batch
  - State persists even when individual pages fail during batch generation
- ✅ Fixed story image path preservation bug (2025-11-30)
  - Added `existingPath` field to page state to preserve original storage paths
  - Updated `uploadImages` to use existing path when no new file is uploaded
  - Prevented `template_image_url` from being overwritten with empty strings during edits
  - Restored lost image URLs for "Journey Beyond the Stars" and "The Sky Garden" stories
- ✅ Added reviews management system (2025-11-30)
  - Created `reviews` table with RLS policies (anyone can read active, admins can manage)
  - Built AdminReviews.tsx page with full CRUD operations (add, edit, delete, toggle active)
  - Seeded initial 4 reviews from hardcoded data
  - Updated Home.tsx to fetch reviews from database with loading states
  - Added "Manage Reviews" card to Admin Dashboard
  - Implemented review rating selector (1-5 stars) and character limits
  - Added display_order field for custom sorting on homepage

**Current State:**
- 📚 Database: 1 active story ("The Sky Garden" - gender: both)
- 📦 Orders: 0 orders placed
- ✅ All secrets configured (RESEND, LOVABLE, LEMONSQUEEZY)
- ✅ Storage buckets configured with proper RLS

**Next Steps:**
1. Add more stories to database (need stories for 'boy' and 'girl' genders)
2. Test complete end-to-end flow (personalize → checkout → PDF → email)
3. Begin Phase 4: Testing & Polish
4. Mobile responsiveness verification
5. Add loading animations and error handling

---

## 📋 Task Status Legend

- ✅ **Completed** - Task is done and tested
- 🚧 **In Progress** - Currently being worked on
- ⏳ **Upcoming** - Not yet started
- ⚠️ **Blocked** - Waiting on dependency

---

# Phase 0: Database & Auth Foundation

## Task 0.1: Create User Roles System ✅

**Prerequisites:**
- Lovable Cloud enabled ✅
- Database access configured ✅

**Implementation:**

```sql
-- Create role enum
CREATE TYPE app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policy: Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policy: Users can view their own roles
CREATE POLICY "Users can view own roles"
ON user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Seed first admin
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, role)
VALUES ('tjhinn@gmail.com', crypt('temporary_password_change_me', gen_salt('bf')), NOW(), 'authenticated')
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'tjhinn@gmail.com'
ON CONFLICT DO NOTHING;
```

**Acceptance Criteria:**
- ✅ `user_roles` table created with RLS enabled
- ✅ `has_role()` function works without recursion
- ✅ Admin seeded for tjhinn@gmail.com (UUID: 54d2d627-2f23-469b-9e74-d18c155b800f)
- ✅ Security definer pattern prevents privilege escalation

**Testing:**
```sql
-- Verify admin role
SELECT * FROM user_roles WHERE role = 'admin';

-- Test has_role function
SELECT public.has_role((SELECT id FROM auth.users WHERE email = 'tjhinn@gmail.com'), 'admin'::app_role);
-- Should return: true
```

**Completed:** 2025-11-11
- Migration: `20251111014742_09e5eb5c-72d8-4478-8607-fedf9a14553e.sql`
- RLS policies: INSERT, UPDATE, DELETE (admins only), SELECT (users see own, admins see all)
- Auth configured with `auto_confirm_email` enabled

---

## Task 0.2: Create Stories Table ✅

**Prerequisites:**
- Task 0.1 completed (for RLS policies)

**Implementation:**

```sql
-- Create stories table with JSONB arrays
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_name TEXT NOT NULL,
  hero_gender TEXT NOT NULL CHECK (hero_gender IN ('boy', 'girl')),
  pages JSONB NOT NULL, -- Array of 24 page texts with {heroName}, {petName}, etc.
  image_prompts JSONB NOT NULL, -- Array of 12 spread prompts for AI generation
  illustration_style TEXT DEFAULT 'whimsical_storybook',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read active stories
CREATE POLICY "Anyone can view active stories"
ON stories
FOR SELECT
USING (is_active = true);

-- RLS Policy: Only admins can modify stories
CREATE POLICY "Admins can insert stories"
ON stories
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update stories"
ON stories
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete stories"
ON stories
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stories_updated_at
BEFORE UPDATE ON stories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Example Story Data Structure:**

```json
{
  "story_name": "The Brave Little Explorer",
  "hero_gender": "boy",
  "pages": [
    "Once upon a time, there was a brave child named {heroName} who lived in {city}.",
    "Every morning, {heroName} would wake up and play with {petName} the {petType}.",
    "...",
    "And they all lived happily ever after. The End."
  ],
  "image_prompts": [
    "Spread 1-2: A whimsical illustration of {heroName}, a {heroGender} child with {photoReference}, standing in front of a cozy house in {city}, with {petName} the {petType} by their side. Style: {illustrationStyle}",
    "Spread 3-4: {heroName} and {petName} discovering a magical forest...",
    "..."
  ]
}
```

**Acceptance Criteria:**
- ✅ Stories table created with JSONB columns
- ✅ Public can read active stories
- ✅ Only admins can create/edit/delete stories
- ✅ `updated_at` trigger works

**Testing:**
```sql
-- Insert sample story
INSERT INTO stories (story_name, hero_gender, pages, image_prompts)
VALUES (
  'The Brave Little Explorer',
  'boy',
  '["Page 1 text...", "Page 2 text..."]'::JSONB,
  '["Spread 1 prompt...", "Spread 2 prompt..."]'::JSONB
);

-- Query as anonymous user (should work)
SELECT * FROM stories WHERE is_active = true;
```

**Completed:** Initial implementation
- Table structure includes JSONB for pages and image_prompts
- RLS policies allow public read, admin-only write
- Sample stories seeded (2 boy + 2 girl stories)

---

## Task 0.3: Create Orders Table ✅

**Prerequisites:**
- Task 0.2 completed (stories table exists)

**Implementation:**

```sql
-- Create order status enum
CREATE TYPE order_status AS ENUM (
  'payment_received',
  'generating_images',
  'pending_admin_review',
  'approved',
  'email_sent',
  'cancelled'
);

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  story_id UUID REFERENCES stories(id) NOT NULL,
  personalization_data JSONB NOT NULL, -- {heroName, petName, city, photo_url, etc.}
  status order_status DEFAULT 'payment_received',
  discount_applied BOOLEAN DEFAULT false,
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_provider_id TEXT, -- Generic field for Stripe, LemonSqueezy, etc.
  pdf_url TEXT,
  download_expires_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view orders
CREATE POLICY "Admins can view all orders"
ON orders
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders"
ON orders
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Index for faster admin queries
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

**Acceptance Criteria:**
- ✅ Orders table created with status enum
- ✅ Only admins can view/update orders
- ✅ Customers cannot query orders table directly
- ✅ Indexes created for performance

**Testing:**
```sql
-- Insert test order (as admin)
INSERT INTO orders (customer_email, customer_name, story_id, personalization_data, amount_paid)
VALUES (
  'test@example.com',
  'Test Parent',
  (SELECT id FROM stories LIMIT 1),
  '{"heroName": "Emma", "petName": "Fluffy", "city": "London"}'::JSONB,
  29.99
);

-- Query as admin
SELECT * FROM orders WHERE status = 'payment_received';
```

**Completed:** Initial implementation
- Order status enum with proper workflow states
- RLS policies restrict all access to admins only
- Indexes on status and created_at for performance
- Integration with LemonSqueezy payment provider

---

## Task 0.4: Configure Secrets ✅

**Prerequisites:**
- Lovable Cloud enabled ✅

**Secrets to Add:**

1. **RESEND_API_KEY**
   - Purpose: Send admin notifications and customer emails
   - Get from: https://resend.com/api-keys
   - **Status:** ✅ Configured

2. **LOVABLE_API_KEY**
   - Purpose: AI image generation via Lovable AI Gateway
   - **Status:** ✅ Configured

3. **LEMONSQUEEZY_API_KEY**
   - Purpose: Payment processing
   - **Status:** ✅ Configured

**Acceptance Criteria:**
- ✅ RESEND_API_KEY configured
- ✅ LOVABLE_API_KEY confirmed active
- ✅ LEMONSQUEEZY_API_KEY configured
- ✅ Secrets visible in backend settings

**Completed:** 2025-11-12

---

# Phase 1: Frontend Flow Enhancement

## Task 1.1: Update Personalize.tsx ✅

**Prerequisites:**
- Task 0.2 completed (stories table exists) ✅

**Changes Required:**

1. ✅ Add database query to prefetch stories for gender filtering
2. ✅ Update form state to match new personalization structure
3. ✅ Add photo upload to storage
4. ✅ Save personalization to localStorage for checkout
5. ✅ **Field name standardization (2025-11-11):** All fields standardized to `heroName` and `petType`

**Key Code Updates:**

```typescript
// Add story prefetch
const { data: stories } = useQuery({
  queryKey: ['stories'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('is_active', true);
    if (error) throw error;
    return data;
  }
});

// Updated form data structure
const [formData, setFormData] = useState({
  heroName: '',
  heroGender: '', // 'boy' or 'girl'
  petName: '',
  petType: 'dog',
  city: '',
  favoriteColor: '',
  favoriteFood: '',
  photoUrl: '' // Will be storage URL after upload
});

// Photo upload handler
const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `hero-photos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('hero-photos')
    .upload(filePath, file);

  if (uploadError) {
    toast.error('Failed to upload photo');
    return;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('hero-photos')
    .getPublicUrl(filePath);

  setFormData(prev => ({ ...prev, photoUrl: publicUrl }));
  toast.success('Photo uploaded!');
};
```

**Acceptance Criteria:**
- ✅ Photo uploads to storage
- ✅ Form data saved to localStorage
- ✅ Gender selection works correctly
- ✅ Navigation to /stories works
- ✅ Field names standardized to `heroName` and `petType` (2025-11-11)

**Testing:**
1. Fill out form
2. Upload photo
3. Click "Continue to Stories"
4. Check localStorage for saved data

**Completed:** 2025-11-11
- Field standardization: `childName` → `heroName`, `petSpecies` → `petType`
- All edge functions updated to use consistent field names
- Database placeholder expectations aligned with form output

---

## Task 1.2: Update StorySelection.tsx ✅

**Prerequisites:**
- Task 0.2 completed (stories table) ✅
- Task 1.1 completed (personalization saved) ✅

**Changes Required:**

1. Query stories from database filtered by hero gender
2. Display stories in grid
3. Save selected story to localStorage
4. Navigate to /preview

**Key Code Updates:**

```typescript
const personalization = JSON.parse(localStorage.getItem('personalization') || '{}');
const heroGender = personalization.heroGender;

const { data: stories, isLoading } = useQuery({
  queryKey: ['stories', heroGender],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('is_active', true)
      .eq('hero_gender', heroGender);
    
    if (error) throw error;
    return data;
  },
  enabled: !!heroGender
});

const handleContinue = () => {
  if (!selectedStory) return;
  localStorage.setItem('selectedStory', JSON.stringify(
    stories.find(s => s.id === selectedStory)
  ));
  navigate('/preview');
};
```

**Acceptance Criteria:**
- ✅ Stories filtered by gender
- ✅ Stories displayed with title and summary
- ✅ Selected story saved to localStorage
- ✅ Navigation to /preview works

**Testing:**
1. Complete personalization with gender = "boy" ✅
2. Verify only boy stories shown ✅
3. Select a story ✅
4. Navigate to preview ✅

**Completed:** 2025-11-06
- Added personalization header with hero photo and name
- Implemented database query filtering stories by gender
- Added loading states and error handling
- Sample stories added for testing (2 boy + 2 girl stories)

---

## Task 1.3: Configure Payment Integration ✅

**DEPRECATED:** Midtrans and Stripe integrations have been replaced with LemonSqueezy.

**Current Active Payment Provider:** LemonSqueezy

**Prerequisites:**
- Lovable Cloud enabled ✅
- LEMONSQUEEZY_API_KEY configured ✅
- RESEND_API_KEY configured ✅

**Implementation Status:**

1. ✅ Order creation flow working
2. ✅ Admin email notification on order creation
3. ✅ LemonSqueezy checkout integration
4. ✅ Webhook handler for payment confirmation

**Current Behavior:**
- Order is created with status `pending_payment`
- User redirected to LemonSqueezy hosted checkout
- Webhook updates order to `payment_received` on successful payment
- Admin receives email notification at tjhinn@gmail.com

**Acceptance Criteria:**
- ✅ Order creation works
- ✅ Admin email sent on order creation
- ✅ LemonSqueezy checkout opens correctly
- ✅ Webhook updates order status to `payment_received`

---

## Task 1.4: Update Preview.tsx with Share Discount ✅

**Prerequisites:**
- Task 1.2 completed (story selected) ✅

**Changes Required:**

1. ✅ Add Web Share API integration (Facebook, X/Twitter, Instagram)
2. ✅ Apply 10% discount on successful share
3. ✅ Display watermarked preview pages (2 sample spreads)
4. Save discount status to localStorage

**Key Code Updates:**

```typescript
const [discountApplied, setDiscountApplied] = useState(
  localStorage.getItem('shareDiscount') === 'true'
);

const handleShare = async () => {
  if (!navigator.share) {
    toast.error('Sharing not supported on this device');
    return;
  }

  try {
    await navigator.share({
      title: 'Check out my personalized storybook!',
      text: 'I just created a magical storybook starring me! ✨',
      url: window.location.origin
    });

    // Share successful
    localStorage.setItem('shareDiscount', 'true');
    setDiscountApplied(true);
    toast.success('🎉 Share successful! 10% discount applied!');
  } catch (error) {
    if (error.name !== 'AbortError') {
      toast.error('Share cancelled');
    }
  }
};
```

**Acceptance Criteria:**
- ✅ Share button triggers Web Share API
- ✅ Discount applied on success
- ✅ Confetti animation on discount
- ✅ Watermarked preview displayed

**Testing:**
1. Click "Share & Get 10% Off"
2. Complete share flow
3. Verify discount badge appears
4. Check localStorage

---

## Task 1.5: Update Checkout.tsx with LemonSqueezy ✅

**Status:** COMPLETED

**Prerequisites:**
- Task 1.3 completed (LemonSqueezy configured) ✅
- Task 1.4 completed (discount logic) ✅

**Changes Completed:**

1. ✅ Removed Midtrans Snap SDK integration
2. ✅ Updated to call `create-lemonsqueezy-checkout` edge function
3. ✅ Apply discount if `shareDiscount` exists
4. ✅ Redirect to LemonSqueezy hosted checkout page
5. ✅ Updated pricing display to USD ($9.99)
6. ✅ Navigate to /thank-you after successful payment

**Key Implementation:**

```typescript
const handlePayment = async () => {
  const personalizationData = JSON.parse(localStorage.getItem("personalizationData") || "{}");
  const selectedStory = JSON.parse(localStorage.getItem("selectedStory") || "{}");

  // Call edge function to create LemonSqueezy checkout
  const { data, error } = await supabase.functions.invoke("create-lemonsqueezy-checkout", {
    body: {
      userEmail: email,
      amount: finalPrice, // in cents
      discountApplied: hasDiscount,
      discountCode: hasDiscount ? "SHARE10" : undefined,
      personalizationData,
      storyId: selectedStory.id,
    },
  });

  // Store order ID for thank you page
  localStorage.setItem("orderId", data.orderId);

  // Redirect to LemonSqueezy hosted checkout
  window.location.href = data.checkoutUrl;
};
```

**Acceptance Criteria:**
- ✅ LemonSqueezy checkout redirect works correctly
- ✅ Discount applied if share completed
- ✅ Order created in database with `pending_payment` status
- ✅ User redirected to LemonSqueezy
- ✅ After payment, user returns to /thank-you
- ✅ Pricing displayed in USD

**Testing:**
1. Complete checkout flow
2. Verify redirect to LemonSqueezy checkout page
3. Complete test payment in LemonSqueezy
4. Verify webhook updates order status
3. Check payment confirmation

---

## Task 1.6: Update ThankYou.tsx ✅

**Prerequisites:**
- Task 1.5 completed (order created) 🚧

**Changes Required:**

1. Display whimsical 24-hour message
2. Show preview of cover (non-watermarked placeholder)
3. Clear localStorage
4. No download link (admin will email later)

**Key Code:**

```typescript
const ThankYou = () => {
  const personalization = JSON.parse(localStorage.getItem('personalization') || '{}');

  useEffect(() => {
    // Clear personalization data after 3 seconds
    const timer = setTimeout(() => {
      localStorage.removeItem('personalization');
      localStorage.removeItem('selectedStory');
      localStorage.removeItem('shareDiscount');
      localStorage.removeItem('orderId');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/20 to-background p-6">
      <Card className="max-w-2xl mx-auto p-8 text-center">
        <Sparkles className="w-16 h-16 mx-auto text-primary animate-pulse" />
        <h1 className="text-3xl font-playfair mt-4">
          ✨ Your Story is Being Crafted! ✨
        </h1>
        <p className="mt-4 text-lg">
          Our storytelling elves are hard at work bringing <strong>{personalization.heroName}</strong>'s 
          adventure to life with custom illustrations.
        </p>
        <p className="mt-2 text-muted-foreground">
          📬 We'll email you within <strong>24 hours</strong> with your magical masterpiece!
        </p>
        <div className="mt-8">
          <img src="/placeholder.svg" alt="Story Preview" className="rounded-lg shadow-lg mx-auto" />
        </div>
        <Button onClick={() => window.location.href = '/'} className="mt-8">
          Back Home
        </Button>
      </Card>
    </div>
  );
};
```

**Acceptance Criteria:**
- ✅ Whimsical 24-hour message displayed
- ✅ Preview image shown
- ✅ localStorage cleared after delay
- ✅ "Back Home" button works

**Testing:**
1. Complete purchase
2. Verify message appears
3. Wait 3 seconds
4. Check localStorage is cleared

**Completed:** 2025-11-07
- Added whimsical 24-hour message with child's name
- Displayed non-watermarked preview cover
- Implemented localStorage clearing after 3 seconds
- Added confetti and sparkles animation on page load
- Added "Back Home" button

---

# Phase 2: Backend Edge Functions

## Task 2.1: Create Storage Buckets ✅

**Prerequisites:**
- Lovable Cloud enabled ✅

**Implementation:**

```sql
-- Create hero-photos bucket (public for photo uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-photos', 'hero-photos', true);

-- Create generated-pdfs bucket (private, signed URLs only)
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-pdfs', 'generated-pdfs', false);

-- RLS for hero-photos: Anyone can upload
CREATE POLICY "Anyone can upload hero photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'hero-photos');

-- RLS for generated-pdfs: Only admins can upload
CREATE POLICY "Admins can upload PDFs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'generated-pdfs' AND
  public.has_role(auth.uid(), 'admin')
);

-- RLS for generated-pdfs: Admins can read
CREATE POLICY "Admins can read PDFs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'generated-pdfs' AND
  public.has_role(auth.uid(), 'admin')
);
```

**Acceptance Criteria:**
- ✅ `hero-photos` bucket created (public)
- ✅ `generated-pdfs` bucket created (private)
- ✅ RLS policies configured

**Completed:** 2025-11-11
- Created `hero-photos` bucket (public access for uploads/reads)
- Created `generated-pdfs` bucket (private, admin-only reads)
- **Updated RLS policies (2025-11-11):**
  - `hero-photos`: Public INSERT and SELECT policies for anonymous uploads
  - `generated-pdfs`: Admin-only SELECT, edge functions use service role for uploads
- Migration: `20251111015020_67bb7009-55d2-4fd6-864d-5175ed4e2103.sql`

---

## Task 2.2: Create submit-order Edge Function ⏳

**Prerequisites:**
- Task 0.3 completed (orders table)
- Task 0.4 completed (RESEND_API_KEY)
- Task 2.1 completed (storage buckets)

**File:** `supabase/functions/submit-order/index.ts`

**Implementation:**

**DEPRECATED - STRIPE EXAMPLE:**
This example has been replaced with LemonSqueezy implementation.
See `supabase/functions/create-lemonsqueezy-checkout/index.ts` for the active payment integration.

**Note:** The original Stripe example code has been removed. The project now uses LemonSqueezy for all payment processing.

---

## Task 2.3: Create generate-storybook Edge Function ❌ DEPRECATED

**Status:** ❌ DEPRECATED - Replaced by `generate-single-page` + `compile-storybook-pdf`

**Reason for Deprecation:**
The monolithic `generate-storybook` function frequently exceeded Supabase's 60-second timeout and CPU limits when processing 13 images (cover + 12 pages) in a single invocation. It was replaced by a more reliable batched approach:

1. **`generate-single-page`** - Generates one AI-composited page at a time, called sequentially from admin dashboard
2. **`compile-storybook-pdf`** - Assembles the final PDF in 3 batches (4 pages each) to avoid CPU timeouts

**Removed:** 2026-01-25
- Deleted `supabase/functions/generate-storybook/` folder
- Removed from `supabase/config.toml`
- Deleted deployed function from Supabase

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderId } = await req.json();

    // Update status to generating
    await supabase
      .from('orders')
      .update({ status: 'generating_images' })
      .eq('id', orderId);

    // Fetch order with story data
    const { data: order } = await supabase
      .from('orders')
      .select('*, stories(*)')
      .eq('id', orderId)
      .single();

    const { personalization_data, stories } = order;
    const imagePrompts = stories.image_prompts as string[];

    // Generate 12 spread images using Lovable AI
    const generatedImages = [];
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    for (let i = 0; i < imagePrompts.length; i++) {
      const prompt = imagePrompts[i]
        .replace('{heroName}', personalization_data.heroName)
        .replace('{petName}', personalization_data.petName)
        .replace('{city}', personalization_data.city)
        .replace('{photoReference}', personalization_data.photoUrl);

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            { role: 'user', content: prompt }
          ],
          modalities: ['image', 'text']
        }),
      });

      const data = await response.json();
      const imageBase64 = data.choices[0].message.images[0].image_url.url;
      generatedImages.push(imageBase64);

      console.log(`Generated spread ${i + 1}/12`);
    }

    // Create PDF from images
    const pdfDoc = await PDFDocument.create();
    
    for (const imageBase64 of generatedImages) {
      const imageBytes = Uint8Array.from(atob(imageBase64.split(',')[1]), c => c.charCodeAt(0));
      const image = await pdfDoc.embedPng(imageBytes);
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }

    const pdfBytes = await pdfDoc.save();

    // Upload PDF to storage
    const fileName = `${orderId}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('generated-pdfs')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get signed URL (7-day expiry)
    const { data: { signedUrl } } = await supabase.storage
      .from('generated-pdfs')
      .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

    // Update order with PDF URL and set status to pending review
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await supabase
      .from('orders')
      .update({
        status: 'pending_admin_review',
        pdf_url: signedUrl,
        download_expires_at: expiresAt.toISOString(),
      })
      .eq('id', orderId);

    return new Response(
      JSON.stringify({ success: true, pdfUrl: signedUrl }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

**Config Entry:**

```toml
[functions.generate-storybook]
verify_jwt = true
```

**Acceptance Criteria:**
- ✅ Generates 12 spreads using Lovable AI
- ✅ Creates PDF from images
- ✅ Uploads PDF to storage
- ✅ Updates order status to `pending_admin_review`

---

## Task 2.4: Create approve-order Edge Function ✅

**Prerequisites:**
- Task 0.4 completed (RESEND_API_KEY) ✅
- Task 2.3 completed (PDF generation) ✅

**File:** `supabase/functions/approve-order/index.ts`

**Status:** ✅ Completed - Function deployed and operational

**Key Features:**
- Validates order is in `pending_admin_review` status
- Sends beautifully formatted HTML email to customer
- Includes personalized message with hero name and story title
- Provides download link with 7-day expiry notice
- Updates order status to `email_sent`
- Records approval and email timestamps

**Completed:** 2025-11-12

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderId } = await req.json();

    // Fetch order
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (order.status !== 'pending_admin_review') {
      throw new Error('Order not ready for approval');
    }

    // Send customer email with download link
    await resend.emails.send({
      from: 'YourFairyTale.ai <stories@yourdomain.com>',
      to: [order.customer_email],
      subject: '✨ Your Magical Storybook is Ready!',
      html: `
        <h1>✨ ${order.personalization_data.heroName}'s Adventure Awaits! ✨</h1>
        <p>Dear ${order.customer_name},</p>
        <p>Your personalized 24-page storybook is ready to download!</p>
        <p><a href="${order.pdf_url}" style="background: #FF8B00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Download Your Storybook</a></p>
        <p><small>This link expires in 7 days.</small></p>
        <p>With love,<br>The YourFairyTale.ai Team 🧚</p>
      `,
    });

    // Update order status
    await supabase
      .from('orders')
      .update({ status: 'email_sent' })
      .eq('id', orderId);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

**Config Entry:**

```toml
[functions.approve-order]
verify_jwt = true
```

**Acceptance Criteria:**
- ✅ Sends customer email with download link
- ✅ Updates order status to `email_sent`
- ✅ Only works for `pending_admin_review` orders

---

# Phase 3: Admin Dashboard

## Task 3.1: Create Admin Login Page ✅

**Prerequisites:**
- Task 0.1 completed (user_roles table) ✅

**File:** `src/pages/AdminLogin.tsx`

**Status:** ✅ Completed - Admin authentication working

**Key Features:**
- Email/password authentication
- Role verification using `has_role()` function
- Redirect to admin dashboard on success
- Error handling for invalid credentials or non-admin users
- Session management

**Completed:** 2025-11-12

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      toast.error('Invalid credentials');
      return;
    }

    // Verify admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      await supabase.auth.signOut();
      toast.error('Access denied: Admin only');
      return;
    }

    toast.success('Welcome, admin!');
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
        <form onSubmit={handleLogin}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4"
          />
          <Button type="submit" className="w-full">Login</Button>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;
```

**Acceptance Criteria:**
- ✅ Admin can log in with email/password
- ✅ Role verified server-side
- ✅ Non-admins denied access
- ✅ Redirects to /admin/dashboard

---

## Task 3.2: Create Admin Dashboard - Orders View ✅

**Completed:** 2025-11-08
- Created `/admin/orders` page with full order management
- Status filtering and order details display
- Integrated with generate-storybook and approve-order functions

---

## Task 3.3: Create Story Management CRUD ✅

**Prerequisites:**
- Task 3.1 completed (admin login)
- Task 2.3 completed (orders with PDFs)

**File:** `src/pages/admin/Dashboard.tsx`

**Implementation:**

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const { data: orders, refetch } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, stories(story_name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // NOTE: This example code is OUTDATED. The current implementation uses:
  // 1. handleStartGeneration() - calls generate-single-page for each page
  // 2. handleCompilePDF() - calls compile-storybook-pdf to assemble the final PDF
  // See AdminOrders.tsx and OrderActions.tsx for the current implementation.

  const handleApprove = async (orderId: string) => {
    const { error } = await supabase.functions.invoke('approve-order', {
      body: { orderId },
    });

    if (error) {
      toast.error('Failed to approve order');
      return;
    }

    toast.success('Order approved! Customer email sent.');
    refetch();
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Order Management</h1>
      <div className="space-y-4">
        {orders?.map((order) => (
          <div key={order.id} className="border p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">{order.customer_name}</h3>
                <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                <p className="text-sm">Story: {order.stories.story_name}</p>
                <Badge>{order.status}</Badge>
              </div>
              <div className="space-x-2">
                {order.status === 'payment_received' && (
                  <Button onClick={() => handleGeneratePDF(order.id)}>
                    Generate PDF
                  </Button>
                )}
                {order.status === 'pending_admin_review' && (
                  <>
                    <Button variant="outline" asChild>
                      <a href={order.pdf_url} target="_blank">Preview PDF</a>
                    </Button>
                    <Button onClick={() => handleApprove(order.id)}>
                      Approve & Send
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
```

**Acceptance Criteria:**
- ✅ Displays all orders
- ✅ "Generate PDF" button for new orders
- ✅ "Preview PDF" + "Approve & Send" for pending review
- ✅ Real-time status updates

---

## Task 3.3: Create Story Management CRUD ✅

**Prerequisites:**
- Task 0.2 completed (stories table) ✅
- Task 3.1 completed (admin auth) ✅

**Files:** 
- `src/pages/AdminStories.tsx`
- `src/pages/AdminCarousel.tsx`

**Status:** ✅ Completed - Story and carousel management operational

**Key Features:**
- Full CRUD for stories (create, read, update, delete)
- JSONB editing for pages and prompts
- Cover image upload to storage
- Toggle active/inactive status
- Carousel image management
- Display order controls

**Completed:** 2025-11-12

---

# Phase 4: Testing & Polish

## Task 4.1: End-to-End Flow Testing ⏳

**Test Cases:**

1. **Customer Journey:**
   - [ ] Personalize form → Story selection → Preview → Checkout → Thank you
   - [ ] Share discount applies correctly
   - [ ] Photo uploads successfully
   - [ ] Payment processes

2. **Admin Journey:**
   - [ ] Login as admin
   - [ ] Generate PDF for new order
   - [ ] Preview PDF
   - [ ] Approve order
   - [ ] Verify customer receives email

3. **Edge Cases:**
   - [ ] Invalid payment
   - [ ] Missing photo
   - [ ] Expired download link

---

## Task 4.2: Mobile Responsiveness ⏳

**Check:**
- [ ] All pages mobile-friendly
- [ ] Touch targets 44px minimum
- [ ] Forms usable on small screens
- [ ] Images optimized

---

## Task 4.3: Animation & Polish ⏳

**Add:**
- [ ] Sparkle animations on key moments
- [ ] Confetti on discount applied
- [ ] Loading states for AI generation
- [ ] Toast notifications for all actions

---

## Task 4.4: Error Handling ⏳

**Implement:**
- [ ] Network error fallbacks
- [ ] Payment failure messages
- [ ] Storage upload errors
- [ ] Edge function timeouts

---

# 📊 Summary

**Total Tasks:** 22  
**Completed:** 11  
**In Progress:** 0  
**Upcoming:** 11  

**Phase Status:**
- ✅ Phase 0: Database & Auth Foundation (4/4 complete)
- ✅ Phase 1: Frontend Flow Enhancement (6/6 complete)  
- 🚧 Phase 2: Backend Edge Functions (3/4 complete - Task 2.2 deprecated)
- 🚧 Phase 3: Admin Dashboard (2/3 complete - Task 3.2 pending verification)
- ⏳ Phase 4: Testing & Polish (0/4 started)

**Next Steps:**
1. ✅ Fix edge function imports (completed)
2. Test complete end-to-end flow (personalize → story → checkout → PDF → email)
3. Add more stories to database (currently only 1 story)
4. Begin Phase 4: Testing & Polish
5. Mobile responsiveness testing
6. Add animations and error handling

**Last Updated:** 2025-11-25  
**Maintainer:** AI Assistant

---

**Last Updated:** 2025-11-07  
**Maintainer:** YourFairyTale.ai Team