# Design Prompt — Student Home (WriterHabit AI)

> Paste this entire file into Claude design as one prompt. It produces a prototype of the **student home dashboard** in 3 distinct versions.

---

## Role & Design Guide (applies to every screen and every version)

You are a senior product designer and mobile UI specialist. Design polished, realistic mobile app screens for **WriterHabit AI**, an AI writing assistant for Grades 1–12 students. Tagline direction: *Build better writing skills every day.* The app must feel educational, trustworthy, premium, friendly, and implementation-ready. Use iPhone-style mobile UI patterns (status bar, safe areas, bottom tab bar) unless stated otherwise.

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
- Light surfaces with subtle glassmorphism touches (translucent blurred headers), 16–24px card radii, soft shadows. No generic primary red/green/blue.
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

## Feature Brief: Student Home

The daily anchor screen. A student (use "Alex", Grade 5) opens the app and should know in 3 seconds: today's writing step, their streak, and where to get help. Real product copy to use:

- Greeting: **"Good morning, Alex 👋"** + "Let's make today a great writing day."
- Stats row: **🔥 7 day streak**, **⭐ 1,240 WriterHabit points**, **Level 4 · Word Explorer**.
- **Weekly Goal** card: "Great progress! You're on track." — "4 of 5 days" with teal progress ring/bar.
- **Today's Assignment** card: title (e.g., "The Magic Forest Adventure"), Estimated time, Skill focus, Rubric focus, Status chip, CTAs **Start Writing** and **Use Canvas**, secondary **Details**.
- **Continue Your Draft** card: eyebrow "CONTINUE WHERE YOU LEFT OFF", "240 words · Step 2 of 4 · 6 min left", CTA **Continue draft**.
- **Daily Practice** card: badge "TODAY'S PRACTICE", "Build your writing habit with a quick 10-minute session." — "10 mins · 3 steps", CTA **Start practice**.
- **Writing coach** entry card: "Ask for hints and questions while you keep control of the writing." Quick chips: **Give me a hint**, **Help me brainstorm**, **Help me revise**.
- **Recent Feedback** card: snippet + "+15 pts" + CTA **Review**.
- **Skill Progress** preview: 2–3 skills with percent bars in teal ("Scores update after assignments, feedback, and revisions.").
- **Your Achievements** strip: badges like *First Steps*, *Word Explorer*, *On Fire* (reward yellow).
- Bottom tab bar: **Home, Practice, ➕ (Create new draft), Messages, Profile** with a raised center create button.

## States to include
- **Loading**: skeleton dashboard ("Preparing today's writing plan.")
- **Empty**: "No assignment yet — Daily practice and feedback will appear here when they are ready." + **View assignments**.
- **Offline banner**: "Offline mode — Showing saved dashboard details. New feedback and progress sync when the connection returns." + **Check again**.
- **Practice complete**: "Practice complete today — You kept the writing habit going."

## Deliverable — design 3 distinct versions

Produce **3 complete versions**, labeled **Version A**, **Version B**, **Version C**, each a full dashboard with the tab bar — differing in information architecture and visual rhythm, not just color:

- **Version A — Focus First:** hero "Today's Assignment" dominates above the fold; everything else stacks below in calm cards.
- **Version B — Habit Loop:** streak/Daily Rhythm ring is the hero; horizontal carousels for assignment, draft, and feedback; gamified but tasteful.
- **Version C — Grade 9–12 Productivity:** denser, mature layout; compact stat header, agenda-style list of today's steps, muted celebration.

**What must stay constant across versions:** exact color tokens, academic-integrity copy rules, the listed content modules, tab bar, required states, iPhone patterns.
