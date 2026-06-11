# Design Prompt — Parent Experience (WriterHabit AI)

> Paste this entire file into Claude design as one prompt. It produces a prototype of the **parent** feature in 3 distinct versions.

---

## Role & Design Guide (applies to every screen and every version)

You are a senior product designer and mobile UI specialist. Design polished, realistic mobile app screens for **WriterHabit AI**, an AI writing assistant for Grades 1–12 students. Tagline direction: *Build better writing skills every day.* The app must feel educational, trustworthy, premium, friendly, and implementation-ready. Use iPhone-style mobile UI patterns (status bar, safe areas, tab/navigation) unless stated otherwise.

### Academic integrity & coaching tone (non-negotiable)
WriterHabit AI is a learning app, not a cheating tool. The parent experience reinforces this: parents **observe and encourage** — they don't edit student work. Real anchor copy: *"Track progress, feedback, and next practice without taking over the student's work."*
- **Forbidden CTAs/labels:** "Write my essay", "Finish for me", "Give me the answer", "Generate final draft", "Do my homework".
- **Approved CTAs/labels:** "Give me a hint", "Help me brainstorm", "Check my sentence", "Explain this mistake", "Help me revise", "Suggest a stronger word", "Ask me a question".

### Premium copy & microcopy system
- **Action verbs:** Spark Ideas, Outline, Map Out, Refine, Elevate, Sculpt, Tune, Inspect, Audit.
- **Success & celebration:** "Streak Active", "Daily Rhythm", "Skill Milestone", "Wordsmith".
- **Calm, empathetic recovery:** "You're offline, but your draft is safe on your device.", "Something stumbled. Let's retry."
- **Anticipation cues for processing:** "Building the weekly progress report...", "Analyzing writing growth..."

### Visual system (use these exact tokens)
- **Primary Indigo/Blue:** `#2563EB` (pressed `#1D4ED8`; tints `#DBEAFE`, `#EFF6FF`)
- **Progress Teal/Green:** `#14B8A6`, success `#16A34A` (tints `#F0FDFA`, `#DCFCE7`)
- **Reward Warm Yellow:** `#F59E0B` (tint `#FEF3C7`) — the child's streaks/badges only
- **Error Soft Salmon/Red:** `#DC2626` on tint `#FEE2E2` — error states only, never decoration
- **Surfaces & text:** app background `#F6FAFF`, cards `#FFFFFF`/`#FCFEFF`, text slate `#0F172A` / `#475569` / muted `#94A3B8`
- Light surfaces with subtle glassmorphism touches, 16–24px radii, soft shadows. No generic primary red/green/blue.
- **Typography:** the parent surface is an **adult UI** — calmer, slightly denser, professional; the child's gamified elements appear only as reported data, not as the parent's own UI language.

### Edge & loading states
Show loading skeletons, friendly empty states, and offline retry banners so every mockup reads as a complete, production-ready screen.

### Output style
Make every screen realistic, polished, and easy for engineers to implement: complete navigation, cards, buttons, and believable, localization-ready copy following the vocabulary rules above.

---

## Feature Brief: Parent Experience

A trust-first companion view of a linked child's writing journey. Header pattern: **"Maya's writing"**. Parents see progress, feedback quality, and the child's actual work — with the AI's coaching role made transparent so parents trust the integrity promise.

## Screens to design

1. **Parent home** — "Maya's writing" / "Track progress, feedback, and next practice without taking over the student's work." Child switcher (if multiple children), this-week summary card (days practiced, minutes, streak), "What Maya is working on" (current assignment + skill focus), latest feedback highlight ("Strength: vivid details in the opening"), and a "How WriterHabit coaches" transparency card. CTAs: **View weekly report**, **See assignments**.
2. **Parent assignments list** — reviewed/submitted assignments with status, date, rubric snapshot chips, and feedback-ready indicators; filter by child and status.
3. **Assignment review (read-only)** — the child's submitted writing (clearly read-only), the AI feedback that was given (Strength / Improvement / Next revision task), the rubric scores, and the child's revision (before → after). A note: "Feedback coaches Maya to revise her own work." Optional parent action: send an encouragement note ("Send encouragement" — predefined warm stickers/phrases, no editing of the work).
4. **Student report** — weekly/monthly report: writing volume chart, skill proficiency trends, revision habit metric ("Maya revised 4 of 5 drafts"), teacher/class context if available, and **Share / Download report**. Building state: "Building the weekly progress report..."
5. **Parent settings** — report frequency (weekly digest email), notification preferences (feedback ready, streak milestones, missed practice — gentle framing), child account management (grade band, daily goal approval), privacy & data controls, manage WriterHabit Plus.

## States to include
- **Empty home:** "No report yet — Reports appear after a linked student completes writing practice."
- **Loading:** "Loading parent home — Checking linked students and recent writing progress."
- **Error:** "Parent home needs attention — We could not load parent progress right now. Try again."
- **Offline:** saved-data banner + retry.

## Deliverable — design 3 distinct versions

Produce **3 complete versions**, labeled **Version A**, **Version B**, **Version C**, differing in tone and IA — not just color:

- **Version A — Calm Digest:** editorial, report-like; weekly narrative first, data second; feels like a beautifully designed school report.
- **Version B — Family Dashboard:** multi-child tiles up top, glanceable metric cards, quick paths to feedback and reports; pragmatic and fast.
- **Version C — Encouragement-First:** leads with the child's latest win and a one-tap encouragement action; data tucked behind; warmest take.

**What must stay constant across versions:** exact color tokens, read-only treatment of student work, "without taking over" framing, transparency about AI coaching, the 5 screens, required states, iPhone patterns.
