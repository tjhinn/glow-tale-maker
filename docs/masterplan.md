🧚‍♀️ masterplan.md
🎬 30-Second Elevator Pitch
YourFairyTale.ai is a mobile-first web app that turns a child's name, photo, and favorite things into a personalized, 24-page illustrated fairy-tale book in minutes. Parents feel the magic of creation without the tech friction — just joy, wonder, and a glowing digital keepsake ready to download or gift.

💡 Problem & Mission
Problem:
 Parents want unique, heartfelt gifts but find custom illustration or print services too complex or expensive.
Mission:
 To make creating a beautiful, emotionally rich, AI-personalized storybook feel as effortless and delightful as reading one — a moment of digital magic for every family.

🎯 Target Audience
Parents aged 25–45 seeking meaningful digital/print gifts.


Gift-givers (aunts, uncles, grandparents) who want emotional impact with minimal setup.


Creative families who love art, stories, and personalized experiences but prefer simplicity.



🌟 Core Features
Personalization Form: name, gender, pet type, color, city, favorite food, and photo upload.


Story Selection Grid: choose among short, moral-driven tales.


Live Preview: shows personalized cover + sample spreads (with watermark).


Social-share discount: integrated via navigator.share().


Stripe Checkout: glowing, friendly payment UI.


Thank-you Page: non-watermarked book preview + download link.


Admin Dashboard: manage stories, orders, and uploads.


Optional AI Story Compositor: inserts child photo in illustration template.



⚙️ High-Level Tech Stack
Layer
Choice
Why It Fits
Frontend
React (Vite + TypeScript + Tailwind + shadcn/ui)
Fast, responsive, design-system ready
Backend
Lovable Cloud Functions
Serverless, scalable, privacy-safe
Storage
Lovable Cloud Assets + signed URLs
Secure upload for photos and stories
Payments
Stripe Elements
Reliable, supports discount logic
Auth
Guest checkout + admin login
Reduces friction for buyers
PDF Generation
Lovable Cloud serverless pipeline
Auto-creates 24-page storybook
Delivery
Expiring link + email
Secure, family-friendly


🧩 Conceptual Data Model (in words)
User (Guest) → has 1..N Orders


Order → includes 1 Personalization + 1 StoryTemplate


Personalization → {name, gender, pet_species, pet_name, city, fav_color, fav_food, photo_url}


StoryTemplate → {id, title, moral, pages[], image_prompts[]}


PDFAsset → generated output; linked to order


AdminUser → manages stories, illustrations, and pricing



### 🎨 Image Generation Strategy

**AI-Powered Illustrations:**
- Each story contains 24 pages of text and 12 image prompts (one per spread)
- The `image_prompts[]` field in `stories` table stores detailed text descriptions
- During PDF generation, these prompts are sent to AI image generation APIs
- Images are generated on-demand per order with personalized details injected
- This ensures every storybook is unique and tailored to the child

**Why AI Generation vs Pre-Made Assets:**
- ✨ **Personalization**: Child's name, appearance, pet, and preferences are woven into each illustration
- 📦 **Scalability**: No need to store thousands of static images
- 🎨 **Consistency**: Single prompt per spread ensures cohesive visual storytelling
- 💾 **Efficiency**: Generated images are temporary; only final PDFs are stored

🎨 UI Design Principles (per Krug's Laws + Lovable ethos)
Don't make me think: every page has one clear next step (large bottom CTA).


Feels like magic: glowing transitions, subtle sparkles, warm palette.


Design for scanning: single-column layout, short labels, visual rhythm.


Kind by default: empty states and error messages are encouraging ("We'll fix that sparkle!").


Mobile-first simplicity: every component finger-friendly; no nested menus.



🔒 Security & Compliance Notes
All uploads stored via signed URLs; auto-expire after generation.


Stripe handles PCI DSS compliance.


COPPA-aligned parental consent before child photo upload.


Generated PDFs use watermark until payment completes.


Admin dashboard requires MFA for story uploads.



🛠️ Phased Roadmap
MVP (Month 1–2)
Build personalization → story selection → checkout flow.


Stripe + share discount logic.


Static illustration set (no AI photo blending).


Watermarked PDF generation + secure download.


V1 (Month 3–4)
Admin dashboard for story management.


Story previews per gender/persona.


Analytics + email delivery pipeline.


V2 (Month 5+)
AI image compositor inserts child photo.


Print-on-demand integration.


Community story submissions + rewards.



⚖️ Risks & Mitigations
Risk
Mitigation
Low checkout conversion on mobile
Keep single-column flow, sticky CTA, short inputs
User privacy concerns (photos)
Signed uploads, no persistent storage beyond 7 days
Art style inconsistency
Restrict to one illustrated style per story
Performance drop with large PDFs
Lazy image loading + serverless compression


🌱 Future Expansion Ideas
Printed hardcover version with real shipping.


Multi-child personalization for siblings.


Seasonal fairy-tale packs (e.g., Winter Wonders, Birthday Edition).


Parent dashboard for tracking purchased stories.


Narrated audiobook mode (voiceover using child's name).



✨ Emotional Thesis
YourFairyTale.ai feels like opening a glowing bedtime story — gentle, kind, and full of wonder — where every parent becomes the author of their child's imagination.

✅ End of masterplan.md
