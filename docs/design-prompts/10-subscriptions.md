# Design Prompt — Subscriptions & Paywall (WriterHabit AI)

> Paste this entire file into Claude design as one prompt. It produces a prototype of the **WriterHabit Plus** subscription feature in 3 distinct versions.

---

## Role & Design Guide (applies to every screen and every version)

You are a senior product designer and mobile UI specialist. Design polished, realistic mobile app screens for **WriterHabit AI**, an AI writing assistant for Grades 1–12 students. Tagline direction: *Build better writing skills every day.* The app must feel educational, trustworthy, premium, friendly, and implementation-ready. Use iPhone-style mobile UI patterns (sheets, App Store purchase conventions) unless stated otherwise.

### Academic integrity & coaching tone (non-negotiable)
WriterHabit AI is a learning app, not a cheating tool. The paywall must never sell "better AI writing" — it sells deeper learning support. Real anchor copy: *"Plus adds progress history, reports, and review depth. It does not write assignments for students."*
- **Forbidden CTAs/labels:** "Write my essay", "Finish for me", "Give me the answer", "Generate final draft", "Do my homework".
- **Approved CTAs/labels:** "Give me a hint", "Help me brainstorm", "Check my sentence", "Explain this mistake", "Help me revise", "Suggest a stronger word", "Ask me a question".

### Premium copy & microcopy system
- **Action verbs:** Spark Ideas, Outline, Map Out, Refine, Elevate, Sculpt, Tune, Inspect, Audit.
- **Success & celebration:** "Streak Active", "Daily Rhythm", "Skill Milestone", "Wordsmith".
- **Calm, empathetic recovery:** "You're offline, but your draft is safe on your device.", "Something stumbled. Let's retry."
- **Anticipation cues for processing:** "Reading your story...", "Crafting your feedback card...", "Analyzing your style..."

### Visual system (use these exact tokens)
- **Primary Indigo/Blue:** `#2563EB` (pressed `#1D4ED8`; tints `#DBEAFE`, `#EFF6FF`)
- **Progress Teal/Green:** `#14B8A6`, success `#16A34A` (tints `#F0FDFA`, `#DCFCE7`)
- **Reward Warm Yellow:** `#F59E0B` (tint `#FEF3C7`) — accents/badging only
- **Error Soft Salmon/Red:** `#DC2626` on tint `#FEE2E2` — error states only, never decoration
- **Surfaces & text:** app background `#F6FAFF`, cards `#FFFFFF`/`#FCFEFF`, text slate `#0F172A` / `#475569` / muted `#94A3B8`
- Light surfaces with subtle glassmorphism touches, 16–24px radii, soft shadows. No generic primary red/green/blue. Premium can read slightly richer (deeper indigo, gold-tinged yellow) but stays calm and trustworthy — never casino-bright.
- **Typography:** modern, high-readability hierarchy.

### Grade-band & audience adaptation
The **buyer is a parent or teacher**, not the child — design for adult trust: clear pricing, easy cancellation, no dark patterns, COPPA-friendly tone. Students may see a gentle upgrade prompt but never a hard block on daily practice.

### Edge & loading states
Show loading skeletons, friendly empty states, and offline retry banners so every mockup reads as a complete, production-ready screen.

### Output style
Make every screen realistic, polished, and easy for engineers to implement: complete navigation, cards, buttons, and believable, localization-ready copy following the vocabulary rules above.

---

## Feature Brief: WriterHabit Plus

Freemium model: daily writing practice and safe coaching stay free; Plus adds depth for families and classrooms. Real benefit copy:
- **Daily writing practice** (free, always): "Students keep daily writing practice and safe coaching on the free plan."
- **Extended progress history**: "See longer skill trends, revision history, and growth signals."
- **Family reports**: progress reports for parents.
- **Canvas work archive**: "Keep more handwriting and canvas work available for review over time."
- Trust block (real): "Built for learning and family trust" with Privacy / Terms links and disclosure "Store checkout will confirm price, renewal, cancellation, and account owner approval before release."

## Screens to design

1. **Paywall** — "WriterHabit Plus" / "Practice support that keeps students doing the thinking." Benefit cards (use the 4 benefits above, mark free items as "Included free"), plan selector: **Monthly $7.99** vs **Annual $59.99 (Save 37%)** with annual pre-selected, primary CTA **Start Plus**, **Restore purchases** link, trust block with Privacy/Terms, family-approval note. Show what stays free prominently — this builds trust.
2. **Upgrade prompt (contextual sheet)** — a gentle moment when a free user hits a Plus boundary (e.g., older progress history): small glass sheet, "See the whole growth story — Plus keeps longer skill trends and revision history.", CTAs **See Plus** and **Not now** (equal visual dignity — no guilt-tripping).
3. **Active subscription state** — "WriterHabit Plus is active — Your account has Plus access." Plan card with renewal date ("Renews March 12, 2027"), **Manage plan**, and benefits checklist in teal.

## States to include
- **Loading:** "Loading plan details — Checking the saved plan and available options for this account."
- **Error:** "Plan details did not load — We could not load plan details. Free writing practice still works."
- **Offline:** "Showing saved plan details — Reconnect to refresh before changing a plan."
- **Past due:** "Plan needs attention — Free writing practice remains available while the account owner reviews the plan."

## Deliverable — design 3 distinct versions

Produce **3 complete versions**, labeled **Version A**, **Version B**, **Version C**, differing in persuasion architecture — not just color:

- **Version A — Trust Ledger:** benefits as a free-vs-Plus comparison table; pricing and cancellation terms upfront; the most parent-trust-forward take.
- **Version B — Premium Hero:** rich indigo glass hero with the Plus mark, swipeable benefit cards, sticky plan selector; App Store-polished.
- **Version C — Growth Story:** narrative paywall — shows a sample family report and skill-trend preview ("This is what you unlock"), then plans; benefit-proof first, price second.

**What must stay constant across versions:** exact color tokens, "does not write assignments" trust copy, free-tier prominence, no dark patterns, the 3 screens, required states, iPhone purchase conventions.
