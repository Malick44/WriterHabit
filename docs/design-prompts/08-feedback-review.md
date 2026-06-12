# Design Prompt — Feedback Review & Revision Cycle (WriterHabit AI)

> Paste this entire file into Claude design as one prompt. It produces a prototype of the **feedback review** flow in 3 distinct versions.

---

---

## Current Prototype Direction Override

Use this file together with `00-AGENT-DIRECTION-HABIT-LOOP.md`.

The current selected product direction is **Option B — Habit Loop only**. If this file mentions creating three versions, treat that older instruction as historical exploration context. For current implementation, continue with the Habit Loop direction only.

Preserve the existing Canvas implementation. Integrate with Canvas through existing routes/components where possible. Do not redesign, replace, or duplicate Canvas.

---


## Role & Design Guide (applies to every screen and every version)

You are a senior product designer and mobile UI specialist. Design polished, realistic mobile app screens for **WriterHabit AI**, an AI writing assistant for Grades 1–12 students. Tagline direction: *Build better writing skills every day.* The app must feel educational, trustworthy, premium, friendly, and implementation-ready. Use iPhone-style mobile UI patterns (status bar, safe areas) unless stated otherwise.

### Academic integrity & coaching tone (non-negotiable)
WriterHabit AI is a learning app, not a cheating tool. The AI coach reviews writing and assigns one focused revision task — it never rewrites the draft. Real anchor copy: *"Coaching, not completion — Feedback will focus on one strength, one improvement, and one next revision task."*
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
- **Reward Warm Yellow:** `#F59E0B` (tint `#FEF3C7`) — streaks, points, badges, celebration only
- **Error Soft Salmon/Red:** `#DC2626` on tint `#FEE2E2` — error states only, never decoration
- **Surfaces & text:** app background `#F6FAFF`, cards `#FFFFFF`/`#FCFEFF`, text slate `#0F172A` / `#475569` / muted `#94A3B8`
- Light surfaces with subtle glassmorphism touches, 16–24px radii, soft shadows. No generic primary red/green/blue.
- **Typography:** modern, high-readability hierarchy; sizes and weights adapt to grade band.

### Grade-band adaptation
- **Grades 1–5:** simplified rubric ("Only the most important rubric goals are shown for this grade band"), bigger controls, read-aloud on feedback.
- **Grades 6–8:** structured learning cards, paragraph-level coaching.
- **Grades 9–12:** full rubric detail, mature celebration, productivity tone.

### Edge & loading states
Show loading skeletons, friendly empty states, and offline retry banners so every mockup reads as a complete, production-ready screen.

### Output style
Make every screen realistic, polished, and easy for engineers to implement: complete navigation, cards, buttons, and believable, localization-ready copy following the vocabulary rules above.

---

## Feature Brief: Feedback Review & Revision Cycle

The emotional core loop: submit → AI review → feedback → one focused revision → celebration. Five screens, one continuous journey.

## Screens to design

1. **AI review loading** — "AI Coach is reviewing your writing..." / "This may take about 30 seconds". Animated step checklist (real steps): *Understanding your prompt → Checking your main idea → Looking for strong details → Reviewing grammar & usage → Preparing feedback*, each ticking teal as it completes. "Tip from AI Coach" card: "Great writers add details that help readers see, feel, and understand." Reassurance line: "Your draft is being checked for feedback, not rewritten."
2. **Feedback summary** — "Review" / "One strength, one improvement, and one task to revise your own writing." Three structured cards: **Strength** (teal accent), **Improvement** (indigo accent), **Next revision task** (indigo, prominent). Quoted draft excerpts inside cards. Grammar suggestions section ("Sentence-level coaching you can apply yourself" with "From your draft: …" excerpt + "Your action" line). CTAs: **Start revision task** (primary), **View rubric** (secondary).
3. **Rubric score** — "Rubric scores — Scores are coaching signals, not a final grade." 3–4 criteria rows (Ideas, Organization, Word choice, Conventions) with level chips **Starting / Building / Meeting / Strong** and "3 of 4" progress bars in teal. CTA **Revise one task** with note "Use the scores to make one targeted revision instead of changing everything at once."
4. **Revision screen** — header "Let's Make It Even Better!" / "Review the feedback and make a revision." Sections: **Original Draft** excerpt (with "View Full Screen"), **Guiding question** card, **Task** card, **Your revision** editor (placeholder "Write your revised sentence or short passage...", autosave pill), **Before / After compare** toggle. Footer note: "Make one focused change. WriterHabit does not rewrite it for you." Primary **Submit revision**. Include one inline validation example: "Make a real change to the original excerpt before submitting."
5. **Completion celebration** — confetti-light celebration: "Great Job, Alex!" / "Your assignment is complete!" with **Assignment Complete** badge. "You earned" stat trio: **+25 Points**, **+1 Day Streak**, **+4% Grammar** (reward yellow + teal). "Keep it up! You're building strong writing habits." CTAs **View progress** and **Back to home**.

## States to include
- Loading **still-processing**: "Feedback still preparing — You can check again without changing your draft." + **Check again**.
- **Offline:** "Offline feedback — Showing saved feedback. New progress syncs when the connection returns."
- **Error:** "Feedback did not load — Your draft is still saved. Check the connection and try again."

## Deliverable — design 3 distinct versions

Produce **3 complete versions** of the 5-screen flow, labeled **Version A**, **Version B**, **Version C**, differing in narrative and layout — not just color:

- **Version A — Feedback Card Journey:** each stage is a beautifully crafted "card" handed to the student; loading crafts the card; celebration flips it to a trophy card.
- **Version B — Coach's Desk:** calmer editorial layout; feedback reads like a coach's annotated note with margin highlights on the quoted excerpt; understated celebration (skews 9–12).
- **Version C — Quest Loop:** progress ring around the whole cycle (Review → Revise → Celebrate); playful checkpoint motifs and bigger type (skews 1–5, with read-aloud buttons on feedback cards).

**What must stay constant across versions:** exact color tokens, "coaching, not completion" framing, the strength/improvement/next-task structure, rubric levels vocabulary, the 5 screens, required states, iPhone patterns.