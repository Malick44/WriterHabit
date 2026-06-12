# Design Prompt — Assignments (WriterHabit AI)

> Paste this entire file into Claude design as one prompt. It produces a prototype of the **assignments** feature in 3 distinct versions.

---

---

## Current Prototype Direction Override

Use this file together with `00-AGENT-DIRECTION-HABIT-LOOP.md`.

The current selected product direction is **Option B — Habit Loop only**. If this file mentions creating three versions, treat that older instruction as historical exploration context. For current implementation, continue with the Habit Loop direction only.

Preserve the existing Canvas implementation. Integrate with Canvas through existing routes/components where possible. Do not redesign, replace, or duplicate Canvas.

---


## Role & Design Guide (applies to every screen and every version)

You are a senior product designer and mobile UI specialist. Design polished, realistic mobile app screens for **WriterHabit AI**, an AI writing assistant for Grades 1–12 students. Tagline direction: *Build better writing skills every day.* The app must feel educational, trustworthy, premium, friendly, and implementation-ready. Use iPhone-style mobile UI patterns (status bar, safe areas, navigation bar) unless stated otherwise.

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

## Feature Brief: Assignments

Where a student sees every writing task — daily practice and teacher-assigned work — and its lifecycle. Status vocabulary (real product states): **Not started, Draft, Submitted, In review, Feedback ready, Revising, Completed**. Difficulty labels: **Easy, Moderate, Challenging**.

## Screens to design

1. **Assignment history (list)** — title "Assignments". Filter chips (All / Active / Feedback ready / Completed). Assignment cards with: title (e.g., "The Magic Forest Adventure", "Persuasive Letter: School Lunches", "My Summer Memory"), status chip (color-coded: indigo for active, teal for feedback ready, green for completed, slate for not started), due date ("Due in 3 days"), estimated time ("15 min"), difficulty tag, and skill focus. Feedback-ready cards visibly invite action.
2. **Assignment detail** — title "Assignment details". Prompt card with full writing prompt, **Skill focus** and **Rubric focus** rows, estimated time, difficulty, status timeline (Draft → Submitted → Feedback → Revised → Complete), and primary CTA that adapts to status: **Start writing** / **Continue draft** / **Review feedback**. Secondary: **Use Canvas** for planning.
3. **Assignment submission** — pre-submit review: draft summary card (word count, paragraphs), revision checklist ("Use this checklist to revise your own draft before submitting" — 2 of 3 checked, teal), reassurance copy "Submit when the draft includes your own thinking", primary **Submit for review**, then a success moment "Submitted — Your draft is on its way to feedback review."

## States to include
- **Empty list:** "No assignments yet — Daily writing practice will appear here."
- **Loading:** skeleton cards.
- **Offline:** banner with saved data note + **Check again**.
- **Submit error:** "Submission did not work — Your draft was not submitted. Check your connection and try again." (salmon tint, calm tone).

## Deliverable — design 3 distinct versions

Produce **3 complete versions**, labeled **Version A**, **Version B**, **Version C**, differing in IA and component style — not just color:

- **Version A — Card Stack:** classic vertical card list with prominent status chips; detail screen as long-form scroll.
- **Version B — Timeline:** assignments organized by due date on a vertical timeline; detail screen leads with the status journey.
- **Version C — Grade 1–5 Friendly:** bigger cards, icon-forward, max 3 visible statuses, read-aloud icon on the prompt, simplified submission with one big cheerful submit moment.

**What must stay constant across versions:** exact color tokens, academic-integrity copy rules, status vocabulary, the 3 screens, required states, iPhone patterns.