# implementation-plan.md — YourFairyTale.ai

## 🪜 Step-by-Step Build Sequence

### Phase 1 — Foundation
1. Setup Vite + React + TypeScript + Tailwind.
2. Integrate shadcn/ui for consistent components.
3. Create mobile-first layout and routing skeleton.

### Phase 2 — Personalization Flow
4. Build multi-step personalization form (local storage autosave).  
5. Add photo upload with Lovable Cloud signed URL.  
6. Store child data (name, color, pet, etc.) in temporary state.

### Phase 3 — Story Selection & Preview
7. Fetch stories from Lovable Cloud DB.  
8. Render story grid (2×2, responsive).  
9. Build preview page with cover + sample spread.  
10. Implement share-to-discount logic with confetti.

### Phase 4 — Checkout & Delivery
11. Integrate Stripe Elements.  
12. Pass discount flag from share action.  
13. Generate PDF via serverless function.  
14. Email expiring download link to user.

### Phase 5 — Admin Dashboard
15. CRUD for stories, thumbnails, and tags.  
16. Manage orders, refunds, and uploads.  
17. Add authentication (admin only).

---

## ⏱️ Timeline & Checkpoints
| Week | Goal |
|------|------|
| 1–2 | Setup frontend & design system |
| 3–4 | Build personalization + story selection |
| 5–6 | Preview + checkout flow |
| 7–8 | PDF generation + delivery |
| 9–10 | Admin panel + polish |
| 11–12 | QA, testing, and launch |

---

## 👥 Team Roles & Rituals
- **PM / Founder:** Vision, narrative, content review  
- **Frontend Dev:** React components, animation, responsive flow  
- **Backend Dev:** API routes, PDF generation, Stripe integration  
- **Designer:** Visual system, typography, motion polish  
- **QA / Usability Tester:** Monthly 3-user guerrilla test (Krug’s rule)  

Rituals:  
- Weekly sync (15 min stand-up)  
- Bi-weekly design review  
- Monthly emotional-audit test (per `design-tips.md`)

---

## 🔌 Optional Integrations & Stretch Goals
- Print-on-demand API (Blurb, Printify).  
- AI narration for bedtime reading.  
- Cloud sync for returning users.  
- Analytics dashboard for admin.


