# YourFairyTale.ai - Implementation Tasks

> **Updated:** 2025-11-06  
> **Status:** Ready for implementation  
> **Workflow:** Manual quality check after payment → Admin approval → Customer email delivery

---

## 📋 Task Status Legend

- ✅ **Completed** - Task is done and tested
- 🚧 **In Progress** - Currently being worked on
- ⏳ **Upcoming** - Not yet started
- ⚠️ **Blocked** - Waiting on dependency

---

# Phase 0: Database & Auth Foundation

## Task 0.1: Create User Roles System ⏳

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
- ✅ Admin seeded for tjhinn@gmail.com
- ✅ Security definer pattern prevents privilege escalation

**Testing:**
```sql
-- Verify admin role
SELECT * FROM user_roles WHERE role = 'admin';

-- Test has_role function
SELECT public.has_role((SELECT id FROM auth.users WHERE email = 'tjhinn@gmail.com'), 'admin'::app_role);
-- Should return: true
```

---

## Task 0.2: Create Stories Table ⏳

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

---

## Task 0.3: Create Orders Table ⏳

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
  stripe_payment_id TEXT,
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

---

## Task 0.4: Configure Secrets ⏳

**Prerequisites:**
- Lovable Cloud enabled ✅

**Secrets to Add:**

1. **RESEND_API_KEY**
   - Purpose: Send admin notifications and customer emails
   - Get from: https://resend.com/api-keys
   - **Action:** Use `add_secret` tool

2. **LOVABLE_API_KEY**
   - Purpose: AI image generation via Lovable AI Gateway
   - **Action:** Enable Lovable AI (already provisioned)

**Acceptance Criteria:**
- ✅ RESEND_API_KEY configured
- ✅ LOVABLE_API_KEY confirmed active
- ✅ Secrets visible in backend dashboard

**Testing:**
```typescript
// In edge function
const resendKey = Deno.env.get('RESEND_API_KEY');
const lovableKey = Deno.env.get('LOVABLE_API_KEY');
console.log('Secrets loaded:', { resendKey: !!resendKey, lovableKey: !!lovableKey });
```

---

# Phase 1: Frontend Flow Enhancement

## Task 1.1: Update Personalize.tsx ⏳

**Prerequisites:**
- Task 0.2 completed (stories table exists)

**Changes Required:**

1. Add database query to prefetch stories for gender filtering
2. Update form state to match new personalization structure
3. Add photo upload to Supabase Storage
4. Save personalization to localStorage for checkout

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
- ✅ Photo uploads to Supabase Storage
- ✅ Form data saved to localStorage
- ✅ Gender selection works correctly
- ✅ Navigation to /stories works

**Testing:**
1. Fill out form
2. Upload photo
3. Click "Continue to Stories"
4. Check localStorage for saved data

---

## Task 1.2: Update StorySelection.tsx ⏳

**Prerequisites:**
- Task 0.2 completed (stories table)
- Task 1.1 completed (personalization saved)

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
1. Complete personalization with gender = "boy"
2. Verify only boy stories shown
3. Select a story
4. Navigate to preview

---

## Task 1.3: Enable Stripe Integration ⏳

**Prerequisites:**
- Lovable Cloud enabled

**Implementation:**

1. Use Lovable's Stripe tool to enable integration
2. Configure products:
   - **Product:** "Personalized Storybook (24 pages)"
   - **Price:** $29.99 USD
   - **Discount:** 10% off for share referrals

**Acceptance Criteria:**
- ✅ Stripe enabled in Lovable
- ✅ Product and price created
- ✅ Test mode confirmed

**Testing:**
- Use Stripe test card: `4242 4242 4242 4242`

---

## Task 1.4: Update Preview.tsx with Share Discount ⏳

**Prerequisites:**
- Task 1.2 completed (story selected)

**Changes Required:**

1. Add Web Share API integration
2. Apply 10% discount on successful share
3. Display watermarked preview
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

## Task 1.5: Update Checkout.tsx with Stripe Elements ⏳

**Prerequisites:**
- Task 1.3 completed (Stripe enabled)
- Task 1.4 completed (discount logic)

**Changes Required:**

1. Integrate Stripe Elements
2. Apply discount if `shareDiscount` exists
3. Create payment intent on submit
4. Create order record after successful payment
5. Navigate to /thank-you

**Key Code Updates:**

```typescript
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const personalization = JSON.parse(localStorage.getItem('personalization') || '{}');
  const selectedStory = JSON.parse(localStorage.getItem('selectedStory') || '{}');
  const discountApplied = localStorage.getItem('shareDiscount') === 'true';

  const basePrice = 29.99;
  const finalPrice = discountApplied ? basePrice * 0.9 : basePrice;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    // Call edge function to create order and process payment
    const { data, error } = await supabase.functions.invoke('submit-order', {
      body: {
        email: formData.email,
        customerName: personalization.heroName,
        storyId: selectedStory.id,
        personalization,
        discountApplied,
        amountPaid: finalPrice
      }
    });

    if (error) {
      toast.error('Payment failed');
      return;
    }

    // Confirm payment with Stripe
    const { error: confirmError } = await stripe.confirmCardPayment(
      data.clientSecret,
      { payment_method: { card: cardElement } }
    );

    if (confirmError) {
      toast.error(confirmError.message);
      return;
    }

    toast.success('Payment successful!');
    localStorage.setItem('orderId', data.orderId);
    navigate('/thank-you');
  };

  return (
    <form onSubmit={handlePayment}>
      <CardElement />
      <div className="mt-4">
        <p>Base Price: ${basePrice.toFixed(2)}</p>
        {discountApplied && <p className="text-accent">Discount: -${(basePrice * 0.1).toFixed(2)}</p>}
        <p className="font-bold">Total: ${finalPrice.toFixed(2)}</p>
      </div>
      <Button type="submit" disabled={!stripe}>Pay Securely</Button>
    </form>
  );
};
```

**Acceptance Criteria:**
- ✅ Stripe Elements renders correctly
- ✅ Discount applied if share completed
- ✅ Payment processes successfully
- ✅ Order created in database
- ✅ Navigate to /thank-you

**Testing:**
1. Complete checkout with test card
2. Verify order in database
3. Check Stripe dashboard for payment

---

## Task 1.6: Update ThankYou.tsx ⏳

**Prerequisites:**
- Task 1.5 completed (order created)

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

---

# Phase 2: Backend Edge Functions

## Task 2.1: Create Storage Bucket ⏳

**Prerequisites:**
- Lovable Cloud enabled

**Implementation:**

```sql
-- Create hero-photos bucket (public for photo uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-photos', 'hero-photos', true);

-- Create storybook-pdfs bucket (private, signed URLs only)
INSERT INTO storage.buckets (id, name, public)
VALUES ('storybook-pdfs', 'storybook-pdfs', false);

-- RLS for hero-photos: Anyone can upload
CREATE POLICY "Anyone can upload hero photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'hero-photos');

-- RLS for storybook-pdfs: Only admins can upload
CREATE POLICY "Admins can upload PDFs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'storybook-pdfs' AND
  public.has_role(auth.uid(), 'admin')
);

-- RLS for storybook-pdfs: Admins can read
CREATE POLICY "Admins can read PDFs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'storybook-pdfs' AND
  public.has_role(auth.uid(), 'admin')
);
```

**Acceptance Criteria:**
- ✅ `hero-photos` bucket created (public)
- ✅ `storybook-pdfs` bucket created (private)
- ✅ RLS policies configured

---

## Task 2.2: Create submit-order Edge Function ⏳

**Prerequisites:**
- Task 0.3 completed (orders table)
- Task 0.4 completed (RESEND_API_KEY)
- Task 2.1 completed (storage buckets)

**File:** `supabase/functions/submit-order/index.ts`

**Implementation:**

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.0.0";
import { Resend } from "npm:resend@2.0.0";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

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

    const { email, customerName, storyId, personalization, discountApplied, amountPaid } = await req.json();

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountPaid * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        customerEmail: email,
        storyId,
      },
    });

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_email: email,
        customer_name: customerName,
        story_id: storyId,
        personalization_data: personalization,
        discount_applied: discountApplied,
        amount_paid: amountPaid,
        stripe_payment_id: paymentIntent.id,
        status: 'payment_received',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Send admin notification email
    await resend.emails.send({
      from: 'YourFairyTale.ai <orders@yourdomain.com>',
      to: ['tjhinn@gmail.com'],
      subject: `🎨 New Order: ${customerName}'s Storybook`,
      html: `
        <h2>New Order Received!</h2>
        <p><strong>Customer:</strong> ${customerName} (${email})</p>
        <p><strong>Hero Name:</strong> ${personalization.heroName}</p>
        <p><strong>Amount Paid:</strong> $${amountPaid}</p>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><a href="${Deno.env.get('SUPABASE_URL')}/admin/orders/${order.id}">View Order</a></p>
      `,
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        orderId: order.id,
      }),
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
[functions.submit-order]
verify_jwt = false
```

**Acceptance Criteria:**
- ✅ Creates Stripe Payment Intent
- ✅ Inserts order into database
- ✅ Sends admin email notification
- ✅ Returns client secret for payment confirmation

**Testing:**
```bash
curl -X POST https://[project-id].supabase.co/functions/v1/submit-order \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "customerName": "Test Parent",
    "storyId": "uuid-here",
    "personalization": {},
    "discountApplied": false,
    "amountPaid": 29.99
  }'
```

---

## Task 2.3: Create generate-storybook Edge Function ⏳

**Prerequisites:**
- Task 0.4 completed (LOVABLE_API_KEY)
- Task 2.1 completed (storage buckets)

**File:** `supabase/functions/generate-storybook/index.ts`

**Implementation:**

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
      .from('storybook-pdfs')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get signed URL (7-day expiry)
    const { data: { signedUrl } } = await supabase.storage
      .from('storybook-pdfs')
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

## Task 2.4: Create approve-order Edge Function ⏳

**Prerequisites:**
- Task 0.4 completed (RESEND_API_KEY)
- Task 2.3 completed (PDF generation)

**File:** `supabase/functions/approve-order/index.ts`

**Implementation:**

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

## Task 3.1: Create Admin Login Page ⏳

**Prerequisites:**
- Task 0.1 completed (user_roles table)

**File:** `src/pages/admin/Login.tsx`

**Implementation:**

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

## Task 3.2: Create Admin Dashboard - Orders View ⏳

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

  const handleGeneratePDF = async (orderId: string) => {
    toast.info('Generating PDF...');
    const { error } = await supabase.functions.invoke('generate-storybook', {
      body: { orderId },
    });

    if (error) {
      toast.error('Failed to generate PDF');
      return;
    }

    toast.success('PDF generated! Now pending your review.');
    refetch();
  };

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

## Task 3.3: Create Story Management CRUD ⏳

**Prerequisites:**
- Task 0.2 completed (stories table)
- Task 3.1 completed (admin auth)

**File:** `src/pages/admin/Stories.tsx`

**Implementation:**

```typescript
// Basic CRUD interface for stories
// - List all stories
// - Add new story with JSONB arrays
// - Edit existing stories
// - Toggle is_active status
// - Delete stories
```

**Acceptance Criteria:**
- ✅ Admin can create new stories
- ✅ JSONB arrays editable via textarea
- ✅ Toggle active/inactive
- ✅ Delete confirmation

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
**Completed:** 0  
**In Progress:** 0  
**Upcoming:** 22  

**Next Steps:**
1. Start with Phase 0 (Database Foundation)
2. Test each task before moving to next phase
3. Deploy edge functions incrementally
4. Test end-to-end flow before launch

---

**Last Updated:** 2025-11-06  
**Maintainer:** YourFairyTale.ai Team
