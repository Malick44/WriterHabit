# Design Prompt — Auth & Launch (WriterHabit AI)

> Paste this entire file into Claude design as one prompt. It produces a prototype of the **authentication & launch** flow in 3 distinct versions.

---

## Role & Design Guide (applies to every screen and every version)

You are a senior product designer and mobile UI specialist. Design polished, realistic mobile app screens for **WriterHabit AI**, an AI writing assistant for Grades 1–12 students. Tagline direction: *Build better writing skills every day.* The app must feel educational, trustworthy, premium, friendly, and implementation-ready. Use iPhone-style mobile UI patterns (status bar, safe areas, home indicator) unless stated otherwise.

### Academic integrity & coaching tone (non-negotiable)
WriterHabit AI is a learning app, not a cheating tool. The AI coach helps students think, plan, and revise their own work.
- **Forbidden CTAs/labels:** "Write my essay", "Finish for me", "Give me the answer", "Generate final draft", "Do my homework".
- **Approved CTAs/labels:** "Give me a hint", "Help me brainstorm", "Check my sentence", "Explain this mistake", "Help me revise", "Suggest a stronger word", "Ask me a question".

### Premium copy & microcopy system
- **Action verbs:** Spark Ideas, Outline, Map Out, Refine, Elevate, Sculpt, Tune, Inspect, Audit.
- **Success & celebration:** "Streak Active", "Daily Rhythm", "Skill Milestone", "Wordsmith", "You've unlocked a new way of expressing your ideas!"
- **Calm, empathetic recovery:** "You're offline, but your draft is safe on your device.", "Something stumbled. Let's retry."
- **Anticipation cues for processing:** "Reading your story...", "Crafting your feedback card...", "Analyzing your style..."

### Visual system (use these exact tokens)
- **Primary Indigo/Blue:** `#2563EB` (pressed `#1D4ED8`; tints `#DBEAFE`, `#EFF6FF`)
- **Progress Teal/Green:** `#14B8A6`, success `#16A34A` (tints `#F0FDFA`, `#DCFCE7`)
- **Reward Warm Yellow:** `#F59E0B` (tint `#FEF3C7`) — streaks, points, badges only
- **Error Soft Salmon/Red:** `#DC2626` on tint `#FEE2E2` — error states only, never decoration
- **Surfaces & text:** app background `#F6FAFF`, cards `#FFFFFF`/`#FCFEFF`, text slate `#0F172A` / `#475569` / muted `#94A3B8`
- Light surfaces with subtle glassmorphism touches (translucent blurred headers and sheets), 16–24px card radii, soft shadows. No generic primary red/green/blue.
- **Typography:** modern, high-readability hierarchy; sizes and weights adapt to grade band.

### Grade-band adaptation
- **Grades 1–5:** larger friendly controls, simple wording, fewer visible metrics, audio/read-aloud affordances.
- **Grades 6–8:** structured learning cards, skill progress, paragraph structure support.
- **Grades 9–12:** mature layout, essay planning tools, rubric detail, productivity-focused UI.

### Edge & loading states
Show loading skeletons, friendly empty states, and offline retry banners so every mockup reads as a complete, production-ready screen.

### Output style
Make every screen realistic, polished, and easy for engineers to implement: complete navigation, cards, buttons, and believable, localization-ready copy following the vocabulary rules above.

---

## Feature Brief: Auth & Launch

This is the first impression of the app for students, parents, and teachers. It must feel safe and premium for parents while staying friendly and unintimidating for a 7-year-old. Authentication is family-aware: students may sign in with simple credentials or a class code; parents and teachers use email.

## Screens to design

1. **Launch screen** — brand mark, app name "WriterHabit AI", tagline *Build better writing skills every day*, subtle loading shimmer. Calm gradient or glass treatment on `#F6FAFF`.
2. **Welcome screen** — hero illustration of writing/growth (no robots doing homework — show a child writing with gentle AI sparkles assisting), value props as 2–3 short cards (e.g., "Daily Rhythm — short practice that builds the habit", "A coach that asks questions, never writes for you", "Progress families can trust"), primary CTA **Get started**, secondary **I already have an account**.
3. **Sign In** — email/username field, password with show/hide, "Forgot password?", primary **Sign in** button, divider with Apple/Google sign-in buttons, link to Sign Up. Include an inline field-level error example in soft salmon ("Check your email address — something stumbled.").
4. **Sign Up** — name, email, password with strength meter (teal when strong), age/role hint ("Students, parents, and teachers each get their own experience"), terms/privacy consent line with COPPA-friendly tone, primary **Create account**.

## States to include
- Sign In **loading** state (button spinner, "Opening your writing space...").
- **Offline banner**: "You're offline, but your draft is safe on your device." with a **Check again** action.
- One **error** example using the salmon error tint only.

## Deliverable — design 3 distinct versions

Produce **3 complete versions** of this flow, labeled **Version A**, **Version B**, **Version C**. Each version must differ meaningfully in layout, hierarchy, and component styling — not just color swaps:

- **Version A — Calm Classic:** centered card layout, generous whitespace, illustration-forward welcome.
- **Version B — Glass Hero:** full-bleed soft gradient hero with glassmorphism sign-in sheet sliding over it.
- **Version C — Playful Trust:** rounder, friendlier shapes tuned for younger families; bigger touch targets, mascot-scale brand mark, parent-trust microcopy more prominent.

**What must stay constant across versions:** exact color tokens, academic-integrity copy rules, screen list, required states, iPhone patterns.
