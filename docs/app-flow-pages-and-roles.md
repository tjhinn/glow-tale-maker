🧭 app-flow-pages-and-roles.md

🪄 Product Overview
YourFairyTale.ai is a mobile-first web app that transforms a child’s name, favorites, and photo into a personalized illustrated storybook.
It’s not just a transaction — it’s an emotional experience.
 The journey from “Start” to “Thank You” must feel like turning pages in a magical, glowing storybook.

🧱 Core User Roles
👩‍👧 Parent / Gift Giver (Guest User)
Capability
Description
Personalize Story
Enter child info, upload photo
Preview Story
View cover and sample pages (with watermark)
Share Preview
Get discount via social share
Purchase Story
Pay via LemonSqueezy
Download
Receive PDF link (non-watermarked)
Guest Checkout
No account required


🧑‍💻 Admin (Story Creator)
Capability
Description
Login via email/password
Basic authentication (Lovable Cloud)
Manage Stories
Add, edit, tag story templates
Upload Illustration Assets
Store in Lovable Cloud
View Orders
Track completed or refunded transactions
Update Prices
Managed in LemonSqueezy dashboard (product variants)
Future (post-MVP)
Manage AI composite templates


🧩 App Flow (User Journey)
Below is the complete screen-by-screen breakdown — matching your wireframes and integrated with illustration + animation guidance.

1️⃣ Homepage — “Begin Your Story”
📍 Path
/
🎯 Purpose
Instantly enchant visitors with visual storytelling and emotional clarity.
🧠 Elements
Hero Carousel → rotating illustrated spreads from sample books (forest, seaside, etc.)


Subtle Sparkle Animation on illustrations


Reviews Carousel → 3–5 user testimonials


Sticky CTA: “✨ Start Your Fairy Tale”


🪶 Illustration Role
Hero art is the hook.
Whimsical, full-screen spreads featuring bright nature scenes (trees, rivers, stars).


Optional light parallax (e.g., leaves move slightly).


💬 Microcopy Example
“Every child deserves to be the hero of their own story.”
✅ CTA → /personalize

2️⃣ Personalization Form — “Meet Your Hero”
📍 Path
/personalize
🎯 Purpose
Collect personalization data in small, emotional steps.
🧠 Fields
Step
Field
Example
1
Child’s Name
“Who’s our brave hero?”
2
Gender
“Boy or Girl?”
3
Pet Name
“Who’s the loyal sidekick?”
4
City
“Where does our adventure begin?”
5
Favorite Color
“What color shines brightest for them?”
6
Favorite Food
“What treat rewards their courage?”
7
Upload Photo
“Add a photo to bring your story to life!”

🪶 Illustration Role
Each step shows a tiny whimsical character reacting to progress (e.g., waving fairy, peeking pet, sparkling wand).


Upload section → character “magically paints” the uploaded image.


🧠 Motion
Soft slide transition between steps (left → right).


Gentle scale “pop” after each completion.


✅ CTA → /choose-story
Back button: soft red, always visible bottom-left.

3️⃣ Story Selection — “Choose Your Adventure”
📍 Path
/choose-story
🎯 Purpose
Let users choose their story variant (based on gender, theme, or pet type).
🧠 Elements
2×2 grid of story option cards


Each card:


Cover illustration thumbnail


Short summary


Moral of the story


🪶 Illustration Role
Each tile contains distinct cover art (forest, seaside, mountain, dreamland).


Hover or tap → slight glow & parallax motion.


Selected story card glows with orange border.


💬 Microcopy Example
“Every adventure begins with a choice — which one will your hero take?”
✅ CTA → /preview

4️⃣ Preview Page — “See the Magic”
📍 Path
/preview
🎯 Purpose
Show a personalized preview of the book with watermark.
 Offer social-share discount before payment.
🧠 Elements
Section
Component
Left
Watermarked storybook cover (auto-generated)
Right
Discount applied indicator
CTA
“✨ Share your preview & get 10% off!”
Secondary CTA
“Continue to Checkout”

⚙️ Logic
On successful share → 10% discount applied automatically in checkout session.


On cancel → friendly reminder popup: “No worries, you can share later!”


🪶 Illustration Role
Background: soft forest vignette or pastel wave pattern.


Sparkles trail across the preview card.


Watermark overlay uses subtle leaf pattern.


✅ CTA → /payment

5️⃣ Payment / Checkout — “Finalize Your Fairy Tale”
📍 Path
/payment
🎯 Purpose
Securely handle payment via LemonSqueezy and finalize purchase.
🧠 Elements
Area
Function
Left
Cover preview with watermark
Right
Email + pricing display with live discount status
CTA
“✨ Pay Securely” (glowing orange pulse)
Success
Confetti burst + thank-you toast

⚙️ Logic
Payment triggers Lovable Cloud function → generates full-resolution, non-watermarked PDF.


Email confirmation with download link (expires in 7 days).


🪶 Illustration Role
Gentle ambient background (soft gradient).


Optional illustrated pet cheering animation after payment.


✅ CTA → /thank-you

6️⃣ Thank-You Page — “Your Story Awaits”
📍 Path
/thank-you
🎯 Purpose
Deliver the final file and emotional payoff.
🧠 Elements
“Your fairy tale is ready!” header


Full, non-watermarked preview of the storybook cover


CTA: “Download High-Res File”


Input for email delivery


🪶 Illustration Role
Full-screen, joyous ending scene (e.g., child & pet celebrating under stars).


Optional animated confetti.


Floating sparkle loop.


💬 Microcopy Example
“The magic is complete, [ParentName]!
 Your fairy tale is ready to be treasured forever.”
✅ CTA → “Back Home” → /

7️⃣ Admin Dashboard
📍 Path
/admin
🎯 Purpose
Enable story content management and fulfillment tracking.
🧠 Elements
Login page (email/password)


Story manager (list, add, edit)


Order viewer


Upload illustrations (Lovable Cloud storage)


Optional: regenerate story PDFs


🪶 Illustration Role
Subtle background art (open book or quill).


Decorative, not distracting — admin focus on usability.



🔁 Data Flow Summary
Input
Stored In
Used By
Child Info
LocalStorage + Lovable Cloud (temporary)
PDF personalization
Uploaded Photo
Signed URL (Lovable Cloud)
Illustration composite
Story Selection
LocalStorage
Preview generation
Payment Result
LemonSqueezy → Webhook → Cloud
Order record
Email
Order confirmation + file delivery
Thank-you & marketing follow-up


⚙️ Navigation Logic
From
To
Condition
Homepage
Personalization
CTA click
Personalization
Story Selection
Form completed
Story Selection
Preview
Story selected
Preview
Payment
Discount handled (optional)
Payment
Thank-You
Payment success
Thank-You
Homepage
“Back Home” CTA


🧩 State Management (Frontend)
LocalStorage → stores temporary personalization data.


React Context → global store for name, gender, storyID, discount flag.


LemonSqueezy Webhook → validates payment success before rendering Thank-You page.



💫 Emotion & Illustration Map (Summary)
Screen
Emotion
Illustration Type
Motion
Homepage
Wonder
Full hero spreads
Sparkle fade
Personalization
Curiosity
Character helpers
Slide transitions
Story Selection
Excitement
Cover thumbnails
Glow hover
Preview
Anticipation
Scene vignette
Soft pulse
Payment
Joy
Minimal, serene art
Confetti burst
Thank You
Fulfillment
Full-page art
Sparkle rain


🧠 Key Technical Dependencies
Frontend: React + TypeScript + Vite


Styling: Tailwind CSS + shadcn/ui


Storage: Lovable Cloud (secure uploads + PDF gen)


Payments: LemonSqueezy Checkout (Merchant of Record)


Animation: Framer Motion (sparkles, parallax, transitions)


PDF Generation: Serverless function (Lovable Cloud)



🛡️ Security & Privacy
Photos stored with signed URLs (auto-expiry).


Email + order data encrypted at rest.


COPPA-friendly — parent consent required for photo upload.


LemonSqueezy handles PCI compliance and global tax/VAT as Merchant of Record.



📘 MVP Exit Criteria (Definition of Done)
✅ Users can complete the flow from homepage → payment → thank-you.
 ✅ Personalized PDF generated automatically with correct inputs.
 ✅ LemonSqueezy payment + discount logic functional.
 ✅ Illustrations integrated and responsive.
 ✅ Admin can add/edit stories.
 ✅ 3 external users test with positive flow completion.

✨ Post-MVP Growth Path
AI Photo Composite: Blend child photo into illustration template.


Print-on-Demand Integration: Send to printing partner (Blurb / Printify).


User Accounts: Save stories, track purchases.


Story Expansion: Add seasonal or thematic story packs.


AR Mode (Future): View story scenes in augmented reality.



💫 Final Thought
YourFairyTale.ai isn’t a store — it’s a magical creative ritual.
 Parents feel guided, not sold to. Children become heroes.
 And every touch, word, and illustration whispers:
 “You are loved, and your story matters.”

✅ End of app-flow-pages-and-roles.md

