# Design Prompt — Onboarding (WriterHabit AI)

> Paste this entire file into Claude design as one prompt. It produces a prototype of the **onboarding** flow in 3 distinct versions.

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
- Light surfaces with subtle glassmorphism touches, 16–24px card radii, soft shadows. No generic primary red/green/blue.
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

## Feature Brief: Onboarding

A 6-step personalization flow that turns a new account into a tailored daily writing plan. It must feel like a warm conversation, not a survey. Show a clear step progress indicator (e.g., "Step 2 of 6" or segmented bar in `#2563EB`) and a Back affordance on every step.

## Screens to design

1. **Role selection** — "Who's writing today?" Cards for **Student**, **Parent**, **Teacher** with friendly icons and one-line descriptions (e.g., Student: "Build a daily writing habit"; Parent: "Follow progress without taking over"; Teacher: "Assign, review, and coach").
2. **Grade selection** — grade-band picker (1–5, 6–8, 9–12) or grade grid; the selected band visually hints at how the app adapts ("Bigger buttons and read-aloud help" / "Essay planning and rubric detail").
3. **Writing goals** — multi-select chips/cards: e.g., "Tell better stories", "Stronger paragraphs", "Ace essay structure", "Grow vocabulary", "Write with confidence". Selected state uses `#DBEAFE` tint with indigo border.
4. **Writing confidence** — friendly self-assessment scale (e.g., emoji or 1–5 illustrated slider): "How do you feel about writing right now?" with empathetic helper text "There's no wrong answer — this helps your coach meet you where you are."
5. **Daily practice goal** — pick a daily rhythm: 5 / 10 / 15 minutes per day cards, with a streak preview ("A 10-minute Daily Rhythm builds a streak fast"). Reward-yellow accents allowed here for the streak preview.
6. **Personalized plan summary** — "Your plan is ready!" Generated plan card: grade band, goal chips, daily minutes, first skill focus; anticipation cue while building ("Crafting your plan..."), then primary CTA **Start my first practice**.

## States to include
- Plan summary **building/loading** state with skeleton + "Crafting your plan..."
- An **offline** variant of any one step: "You're offline — your answers are saved on this device."

## Deliverable — design 3 distinct versions

Produce **3 complete versions** of the flow, labeled **Version A**, **Version B**, **Version C**, differing meaningfully in layout and interaction model — not just color swaps:

- **Version A — Guided Cards:** one question per screen, large centered cards, segmented progress bar.
- **Version B — Conversational Coach:** the coach "asks" each question in a chat-like framing with answer chips; warm and dialogic.
- **Version C — Compact Wizard:** denser, mature layout (skews 9–12), top stepper, inline selections, summary builds live in a pinned bottom card.

**What must stay constant across versions:** exact color tokens, academic-integrity copy rules, the 6 steps, required states, iPhone patterns.
