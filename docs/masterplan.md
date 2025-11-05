# masterplan.md — YourFairyTale.ai

## 🪄 Elevator Pitch
YourFairyTale.ai instantly transforms a child’s details — name, photo, and favorites — into a **magical 24-page illustrated artbook**.  
Parents simply tap, personalize, preview, and download.  
Every interaction glows with **warmth and wonder**, blending AI personalization with storybook emotion.

---

## 🎯 Problem & Mission
### Problem
Personalized gifts often feel dull, slow, or overly technical — lacking emotional warmth and immediacy.  
Parents want keepsakes that are **fast, heartfelt, and magical**.

### Mission
Make personalized storytelling **instant, joyful, and human**, using technology that disappears behind delight.

---

## 👨‍👩‍👧 Target Audience
- **Parents (25–45)** — tech-comfortable, emotionally motivated, short on time.  
- **Gift-givers** — grandparents, relatives seeking heartfelt gifts.  
- **Scenarios** — birthdays, holidays, milestones (“first day of school”).  
- **Pain point** — Want creative personalization that feels *human*, not mechanical.

---

## 🌈 Core Features
- Mobile-first flow: Start → Personalize → Choose Story → Preview → Checkout → Download.  
- 24-page illustrated PDF storybook (AI-personalized).  
- Step-by-step personalization form with glow animations.  
- Story selection grid with parallax + sparkle motion.  
- Auto-discount via `navigator.share()` (social share reward).  
- Stripe Elements checkout with confetti success animation.  
- Expiring download link + admin dashboard.

---

## ⚙️ High-Level Tech Stack
| Layer | Technology | Reason |
|--------|-------------|--------|
| **Frontend** | Vite + React + TypeScript + Tailwind + shadcn/ui | Speed, simplicity, beautiful mobile UX |
| **Backend** | Lovable Cloud serverless functions | Secure, scalable PDF & story generation |
| **Payments** | Stripe Elements | PCI compliant, frictionless checkout |
| **Auth** | Email/password (admin), guest checkout | Reduces friction |
| **AI Layer** | Lovable Cloud personalization engine | Lightweight, consistent illustration style |
| **Storage** | Lovable Cloud signed URLs | Private, time-limited access |
| **Delivery** | Serverless PDF link + email | Reliable, private, simple |

---

## 🧩 Conceptual Data Model (ERD in words)
- **User** → `id`, `email`, `session_token` *(optional guest)*  
- **Story Template** → `id`, `title`, `theme`, `illustrations[]`, `prompt_schema`  
- **Personalization** → `user_id`, `child_name`, `photo_url`, `story_choice_id`, `color`  
- **Order** → `order_id`, `story_id`, `discount_flag`, `payment_status`, `pdf_url`  
- **Admin** → manages stories, refunds, and orders

*Flow:*  
User creates a Personalization → selects a Story → generates an Order → receives a PDF.

---

## 🧭 UI Design Principles
- **Emotion first:** Feels like opening a glowing bedtime story.  
- **Krug’s Law:** One clear action per screen.  
- **Motion as kindness:** Subtle sparkles, gentle easing (200–280 ms).  
- **Typography rhythm:** ≥ 1.5× line-height, 8 pt grid.  
- **Accessibility:** WCAG AA+, reduced-motion support.

Anchored in *Kindness in Design* from `design-tips.md`.

---

## 🔒 Security & Compliance
- Stripe handles PCI scope.  
- Signed URLs for uploads (no public access).  
- COPPA parental consent for photo data.  
- GDPR deletion & 7-day expiry links.  

---

## 🗺️ Phased Roadmap
### MVP (3 months)
- Personalization form  
- 3 story templates  
- PDF generation + checkout  
- Admin dashboard  
- Share-to-discount feature  

### V1 (6 months)
- AI photo compositing  
- Multi-language stories  
- Polished motion library  
- Print-order integration  

### V2 (12 months)
- AI-written storylines  
- Multi-child books  
- Co-creation mode (parent + child)  
- Subscription stories  

---

## ⚠️ Risks & Mitigations
| Risk | Mitigation |
|------|-------------|
| Uncanny AI composites | Use consistent illustrated style |
| Mobile checkout friction | Stripe + Apple/Google Pay |
| Photo privacy | Consent + auto deletion |
| Emotional tone drift | Regular `design-tips.md` design audits |
| Admin overload | Start with minimal CRUD MVP |

---

## 🚀 Future Expansion
- Print-on-demand keepsakes  
- Narrated bedtime mode  
- Subscription for new stories  
- Gifting portal  
- Artist collaborations  

---

## ❤️ Reflection
A seamless blend of **AI and affection** — YourFairyTale.ai feels human, magical, and instantly rewarding.


