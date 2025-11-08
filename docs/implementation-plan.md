🚀 implementation-plan.md
🧭 Goal
Deliver a fully functional YourFairyTale.ai MVP within 2 weeks, focusing on:
End-to-end user flow (from homepage → payment → thank-you page).


Secure personalized PDF generation with watermark.


LemonSqueezy payment + share discount.


Emotionally polished, mobile-first UX.



🧱 Step-by-Step Build Sequence (Mindless Micro-Tasks)
🗓️ Day 1–2: Foundation Setup
Spin up Vite + React + TypeScript + Tailwind CSS project.


Integrate shadcn/ui for component primitives (button, card, form).


Configure mobile-first layout (single column, sticky CTA footer).


Set global styles (typography, palette, spacing from design-tips.md).


Initialize Git repo + Lovable Cloud environment.


🗓️ Day 3–4: Homepage
Build Hero Carousel → auto-rotating illustration samples (from provided assets).


Add Reviews Carousel → 3–5 sample testimonials.


Sticky CTA button (“Start Your Fairy Tale”) with glowing hover effect.


Add motion: fade-in hero + sparkle animation on CTA.


Hook up routing → /personalize.


🗓️ Day 5–6: Personalization Form
Build step-based form cards for:


Child name, gender, pet species + name, city, fav color, fav food.


Add upload field for child photo (signed Lovable Cloud upload).


Animate slide transitions between steps.


Add localStorage draft save for progress persistence.


Validate input, guard against incomplete fields.


CTA: “Continue to Next Step” → routes to /choose-story.


🗓️ Day 7–8: Story Selection
Create 2×2 grid (stacked on mobile).


Pull story summaries from static JSON (e.g., 4 sample stories).


Apply parallax hover + sparkle motion on selection.


On select → glow border + personalize story title with name variable.


CTA: “Continue to Next Step” → routes to /preview.


🗓️ Day 9–10: Preview + Payment
Build preview view:


Left: watermarked cover preview.


Right: discount logic + email input for checkout redirect.


Integrate navigator.share() → apply 10% discount when shared.


Animate share success with confetti burst.


On payment success → POST order to Lovable Cloud.


Trigger PDF generation serverless function.


Redirect to /thank-you.


🗓️ Day 11: Thank-You / Download Page
Fetch and display non-watermarked storybook preview.


Add “Download High-Res PDF” and “Email Me My Book” options.


Include playful “Back Home” CTA.


Ensure responsive layout + minimal load times.


🗓️ Day 12–13: Admin Setup
Create /admin route (auth via email/password).


Add basic CMS:


Story list + ability to upload illustrations + story JSON.


Protect routes with Lovable Cloud session tokens.


Test CRUD and story linking.


🗓️ Day 14: Polish + QA
Conduct 3 mobile usability tests (parents or friends).


Refine microcopy and transitions.


Run Lighthouse for performance + accessibility.


Confirm LemonSqueezy test payments + email delivery.


Prepare soft launch (invite-only beta).



⏰ MVP Timeline Overview
Phase
Focus
Days
Setup + Framework
Core scaffolding
2
Homepage
First impression
2
Personalization Flow
Data entry UX
2
Story Selection
Choice + delight
2
Preview + Payment
Core checkout
2
Thank-You + Admin
Wrap + CMS
2
QA & Launch Polish
Test, refine, deploy
2

✅ Total: 14 days

👥 Team Roles & Rituals
Role
Responsibilities
Frequency
Design Lead
Finalize mobile layouts, animation feel
Daily async review
Frontend Dev
React + Tailwind + LemonSqueezy integration
Daily build updates
Backend Dev
Cloud storage, PDF gen, orders API
Every 2–3 days sync
QA / Tester
Run real user flow (mobile)
Every 3 days
PM / Founder (you)
Approve flow, tone, and emotional alignment
Daily 15-min standup

Rituals
🧠 Daily Standup (15 min) → blockers + next focus.


🎨 Usability Test (Day 10, 13, 14) → 3 users, record confusion points.


💬 Nightly summary commit → Slack/Notion check-in.



🔌 Optional Integrations & Stretch Goals (After MVP)
Print-on-Demand (Blurb or Printify) integration for hardcover books.


Email marketing automation via Lovable Cloud triggers (thank-you drip).


Analytics: session tracking + story popularity stats.


AI personalization (child face + scene blending) → post-launch pilot.



🛡️ Launch Checklist
All forms mobile-optimized.


LemonSqueezy payments working in test + live modes.


Watermark clears only after payment success.


Download links expire in 7 days.


No animation overload (respect prefers-reduced-motion).


3 parents test and complete full flow successfully.


Emotional UX review: “Does it still feel magical?”



💫 “Moonshot Mindset” Reflection
Even if 2 weeks only yields a sparkling MVP, it’ll radiate joy, visual polish, and emotional magic. You’ll have a real, lovable app that makes people smile at first click.
 The rest—admin tools, AI blending, print editions—can follow once the core enchantment works.

✅ End of implementation-plan.md

