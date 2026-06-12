# Design Prompt — Profile & Settings (WriterHabit AI)

> Paste this entire file into Claude design as one prompt. It produces a prototype of the **student profile & settings** feature in 3 distinct versions.

---

---

## Current Prototype Direction Override

Use this file together with `00-AGENT-DIRECTION-HABIT-LOOP.md`.

The current selected product direction is **Option B — Habit Loop only**. If this file mentions creating three versions, treat that older instruction as historical exploration context. For current implementation, continue with the Habit Loop direction only.

Preserve the existing Canvas implementation. Integrate with Canvas through existing routes/components where possible. Do not redesign, replace, or duplicate Canvas.

---


## Role & Design Guide (applies to every screen and every version)

You are a senior product designer and mobile UI specialist. Design polished, realistic mobile app screens for **WriterHabit AI**, an AI writing assistant for Grades 1–12 students. Tagline direction: *Build better writing skills every day.* The app must feel educational, trustworthy, premium, friendly, and implementation-ready. Use iPhone-style mobile UI patterns (grouped settings lists, sheets) unless stated otherwise.

### Academic integrity & coaching tone (non-negotiable)
WriterHabit AI is a learning app, not a cheating tool. The AI coach helps students think, plan, and revise their own work.
- **Forbidden CTAs/labels:** "Write my essay", "Finish for me", "Give me the answer", "Generate final draft", "Do my homework".
- **Approved CTAs/labels:** "Give me a hint", "Help me brainstorm", "Check my sentence", "Explain this mistake", "Help me revise", "Suggest a stronger word", "Ask me a question".

### Premium copy & microcopy system
- **Action verbs:** Spark Ideas, Outline, Map Out, Refine, Elevate, Sculpt, Tune, Inspect, Audit.
- **Success & celebration:** "Streak Active", "Daily Rhythm", "Skill Milestone", "Wordsmith".
- **Calm, empathetic recovery:** "You're offline, but your draft is safe on your device.", "Something stumbled. Let's retry."
- **Anticipation cues for processing:** "Reading your story...", "Analyzing your style..."

### Visual system (use these exact tokens)
- **Primary Indigo/Blue:** `#2563EB` (pressed `#1D4ED8`; tints `#DBEAFE`, `#EFF6FF`)
- **Progress Teal/Green:** `#14B8A6`, success `#16A34A` (tints `#F0FDFA`, `#DCFCE7`)
- **Reward Warm Yellow:** `#F59E0B` (tint `#FEF3C7`) — streaks, points, badges only
- **Error Soft Salmon/Red:** `#DC2626` on tint `#FEE2E2` — error/destructive states only
- **Surfaces & text:** app background `#F6FAFF`, cards `#FFFFFF`/`#FCFEFF`, text slate `#0F172A` / `#475569` / muted `#94A3B8`
- Light surfaces with subtle glassmorphism touches, 16–24px radii, soft shadows. No generic primary red/green/blue.
- **Typography:** modern, high-readability hierarchy; sizes and weights adapt to grade band.

### Grade-band adaptation
- **Grades 1–5:** larger friendly controls, simple wording, fewer visible metrics, audio/read-aloud affordances.
- **Grades 6–8:** structured cards, balanced density.
- **Grades 9–12:** mature, compact, productivity-focused.

### Edge & loading states
Show loading skeletons, friendly empty states, and offline retry banners so every mockup reads as a complete, production-ready screen.

### Output style
Make every screen realistic, polished, and easy for engineers to implement: complete navigation, cards, buttons, and believable, localization-ready copy following the vocabulary rules above.

---

## Feature Brief: Profile & Settings

The student's identity hub plus app preferences and a first-class accessibility center. Settings changes here re-personalize the whole app (grade band, daily goal), so they should feel meaningful, not buried.

## Screens to design

1. **Student profile** — avatar (kid-friendly illustrated avatar picker affordance), name "Alex Rivera", grade chip "Grade 5", level card "Level 4 · Word Explorer" with XP bar toward Level 5, identity stats (🔥 7 day streak, ⭐ 1,240 points, 12 assignments completed), badge shelf preview, and rows: **Edit profile**, **My writing goals**, **Daily practice goal (10 min)**, **Linked parent** (shows family link status), **WriterHabit Plus** row.
2. **App settings** — grouped list: **Profile & Plan** (grade band, daily goal — editing reopens the relevant onboarding step as a sheet), **Notifications** (practice reminder time picker, streak alerts, feedback-ready alerts), **Appearance** (theme), **Language**, **Privacy & data** (parent-managed note: "Some settings are managed by your parent"), **About / Help**, **Sign out** (slate, with confirm sheet — destructive confirm uses salmon only on the confirm action).
3. **Accessibility settings** — a proud, first-class screen: **Text size** slider with live preview sentence, **Read aloud** toggle + voice speed, **Dyslexia-friendly font** toggle with preview, **Reduce motion**, **High contrast**, **Haptics**. Each control shows its effect immediately in a preview card.
4. **Profile edit flow (sheet)** — one example sheet: changing **Daily practice goal** with the 5/10/15-minute cards and a streak-preserving note ("Your streak carries over — Daily Rhythm just gets a new target.").

## States to include
- **Loading:** skeleton settings rows.
- **Offline:** "You're offline — changes save on this device and sync later."
- **Save confirmation:** subtle teal toast "Saved — your plan is tuned."

## Deliverable — design 3 distinct versions

Produce **3 complete versions**, labeled **Version A**, **Version B**, **Version C**, differing in structure and personality — not just color:

- **Version A — iOS Native:** clean grouped-list settings with a hero profile header; the most conventional, fastest-to-build take.
- **Version B — Identity Card:** profile as a collectible "writer card" (level, badges, streak) with settings as glass sheets layered beneath; playful, skews 1–8.
- **Version C — Control Center:** dashboard-style settings with toggle tiles and inline previews; accessibility controls promoted to the top level; skews 9–12 and power users.

**What must stay constant across versions:** exact color tokens, academic-integrity copy rules, the 4 screens, accessibility controls as first-class citizens, required states, iPhone patterns.