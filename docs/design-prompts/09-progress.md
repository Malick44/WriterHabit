# Design Prompt — Progress & Achievements (WriterHabit AI)

> Paste this entire file into Claude design as one prompt. It produces a prototype of the **progress** feature in 3 distinct versions.

---

## Role & Design Guide (applies to every screen and every version)

You are a senior product designer and mobile UI specialist. Design polished, realistic mobile app screens for **WriterHabit AI**, an AI writing assistant for Grades 1–12 students. Tagline direction: *Build better writing skills every day.* The app must feel educational, trustworthy, premium, friendly, and implementation-ready. Use iPhone-style mobile UI patterns (status bar, safe areas, navigation) unless stated otherwise.

### Academic integrity & coaching tone (non-negotiable)
WriterHabit AI is a learning app, not a cheating tool. Progress reflects the student's own practice, feedback, and revision work.
- **Forbidden CTAs/labels:** "Write my essay", "Finish for me", "Give me the answer", "Generate final draft", "Do my homework".
- **Approved CTAs/labels:** "Give me a hint", "Help me brainstorm", "Check my sentence", "Explain this mistake", "Help me revise", "Suggest a stronger word", "Ask me a question".

### Premium copy & microcopy system
- **Action verbs:** Spark Ideas, Outline, Map Out, Refine, Elevate, Sculpt, Tune, Inspect, Audit.
- **Success & celebration:** "Streak Active", "Daily Rhythm", "Skill Milestone", "Wordsmith", "You've unlocked a new way of expressing your ideas!"
- **Calm, empathetic recovery:** "You're offline, but your draft is safe on your device.", "Something stumbled. Let's retry."
- **Anticipation cues for processing:** "Reading your story...", "Crafting your feedback card...", "Analyzing your style..."

### Visual system (use these exact tokens)
- **Primary Indigo/Blue:** `#2563EB` (pressed `#1D4ED8`; tints `#DBEAFE`, `#EFF6FF`)
- **Progress Teal/Green:** `#14B8A6`, success `#16A34A` (tints `#F0FDFA`, `#DCFCE7`) — primary chart/skill color
- **Reward Warm Yellow:** `#F59E0B` (tint `#FEF3C7`) — streaks, points, badges only
- **Error Soft Salmon/Red:** `#DC2626` on tint `#FEE2E2` — error states only, never decoration
- **Surfaces & text:** app background `#F6FAFF`, cards `#FFFFFF`/`#FCFEFF`, text slate `#0F172A` / `#475569` / muted `#94A3B8`
- Light surfaces with subtle glassmorphism touches, 16–24px radii, soft shadows. No generic primary red/green/blue.
- **Typography:** modern, high-readability hierarchy; numbers/data get a confident display treatment.

### Grade-band adaptation
- **Grades 1–5:** "Small practice steps add up." — fewer metrics, badge-forward, friendly.
- **Grades 6–8:** "Track practice, revision, and skill growth." — structured skill cards.
- **Grades 9–12:** "Review writing output, rubric growth, and revision habits." — data-forward, productivity tone.

### Edge & loading states
Show loading skeletons, friendly empty states, and offline retry banners so every mockup reads as a complete, production-ready screen.

### Output style
Make every screen realistic, polished, and easy for engineers to implement: complete navigation, cards, buttons, and believable, localization-ready copy following the vocabulary rules above.

---

## Feature Brief: Progress

Where practice becomes visible growth. Skill-growth signals use the vocabulary **Practicing / Growing / Ready / Strong** (history) and percent proficiency. Scores are coaching signals, not grades.

## Screens to design

1. **Progress dashboard** — "Alex's progress". Modules:
   - **Weekly Writing Volume** bar chart (Mon–Sun, teal bars), "1,840 Total Words", trend chip "+12%".
   - **Skill Proficiency** list: e.g., Ideas & Content 78%, Organization 64%, Word Choice 71%, Conventions 58% — teal progress bars with percent.
   - **Recent Achievements** strip (reward-yellow badges).
   - **Assignment History** table-style list: Assignment Name · Date · Score · Signal (Practicing/Growing/Ready/Strong chips), "View all".
2. **Skill detail** — one skill deep-dive (e.g., "Organization"): trend sparkline over 6 weeks, what this skill means in grade-appropriate words, recent evidence ("From 'The Magic Forest Adventure': your beginning hooked the reader"), and a coaching nudge with approved CTA ("Help me revise" entry into practice).
3. **Badges** — badge gallery grid: earned badges in full color with dates (*First Steps*, *Word Explorer*, *On Fire*, *Rising Writer*, *Wordsmith*), locked badges as subtle outlines with unlock hints ("Write 5 days in a row"). Celebration microcopy: "You've unlocked a new way of expressing your ideas!"
4. **Weekly review** — a Sunday-night style recap: "Your Daily Rhythm this week", days-practiced dots, minutes written, one highlighted strength, one focus for next week, and share-with-family affordance ("Send to my parent").

## States to include
- **Empty:** "Progress starts after practice — Skill growth appears after assignments and revisions."
- **Loading:** skeleton charts and rows.
- **Offline:** saved-data banner + **Check again**.

## Deliverable — design 3 distinct versions

Produce **3 complete versions**, labeled **Version A**, **Version B**, **Version C**, differing in data-viz language and IA — not just color:

- **Version A — Clean Analytics:** card-per-module dashboard, crisp charts, restrained celebration (skews 9–12).
- **Version B — Growth Garden:** metaphor-driven — skills grow like plants/paths; badges and streaks woven into a journey map (skews 1–5).
- **Version C — Coach's Report:** narrative-first — the dashboard reads like a weekly coach letter with inline mini-charts and one clear "next focus" (skews 6–8).

**What must stay constant across versions:** exact color tokens (teal = progress, yellow = rewards), signal vocabulary, "coaching signals, not grades" tone, the 4 screens, required states, iPhone patterns.
