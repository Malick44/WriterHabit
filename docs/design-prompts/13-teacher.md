# Design Prompt — Teacher Experience (WriterHabit AI)

> Paste this entire file into Claude design as one prompt. It produces a prototype of the **teacher** feature in 3 distinct versions.

---

---

## Current Prototype Direction Override

Use this file together with `00-AGENT-DIRECTION-HABIT-LOOP.md`.

The current selected product direction is **Option B — Habit Loop only**. If this file mentions creating three versions, treat that older instruction as historical exploration context. For current implementation, continue with the Habit Loop direction only.

Preserve the existing Canvas implementation. Integrate with Canvas through existing routes/components where possible. Do not redesign, replace, or duplicate Canvas.

---


## Role & Design Guide (applies to every screen and every version)

You are a senior product designer and mobile UI specialist. Design polished, realistic mobile app screens for **WriterHabit AI**, an AI writing assistant for Grades 1–12 students. Tagline direction: *Build better writing skills every day.* The app must feel educational, trustworthy, premium, friendly, and implementation-ready. Use iPhone-style mobile UI patterns (status bar, safe areas, tab/navigation) unless stated otherwise.

### Academic integrity & coaching tone (non-negotiable)
WriterHabit AI is a learning app, not a cheating tool. The teacher surface carries the same promise — real anchor copy: a **"Coaching, not completion"** safety note appears in teacher feedback contexts. AI assists the teacher with signals and suggestions; the teacher decides.
- **Forbidden CTAs/labels:** "Write my essay", "Finish for me", "Give me the answer", "Generate final draft", "Do my homework", and for teachers: anything implying auto-grading without review.
- **Approved CTAs/labels:** "Give me a hint", "Help me brainstorm", "Check my sentence", "Explain this mistake", "Help me revise", "Suggest a stronger word", "Ask me a question".

### Premium copy & microcopy system
- **Action verbs:** Spark Ideas, Outline, Map Out, Refine, Elevate, Sculpt, Tune, Inspect, Audit.
- **Success & celebration:** "Streak Active", "Daily Rhythm", "Skill Milestone", "Wordsmith".
- **Calm, empathetic recovery:** "Something stumbled. Let's retry."
- **Anticipation cues for processing:** "Preparing class trends...", "Opening the student submission and rubric notes..."

### Visual system (use these exact tokens)
- **Primary Indigo/Blue:** `#2563EB` (pressed `#1D4ED8`; tints `#DBEAFE`, `#EFF6FF`)
- **Progress Teal/Green:** `#14B8A6`, success `#16A34A` (tints `#F0FDFA`, `#DCFCE7`)
- **Reward Warm Yellow:** `#F59E0B` (tint `#FEF3C7`) — student streak/badge data only
- **Error Soft Salmon/Red:** `#DC2626` on tint `#FEE2E2` — error states only, never decoration
- **Surfaces & text:** app background `#F6FAFF`, cards `#FFFFFF`/`#FCFEFF`, text slate `#0F172A` / `#475569` / muted `#94A3B8`
- Light surfaces with subtle glassmorphism touches, 16–24px radii, soft shadows. No generic primary red/green/blue.
- **Typography:** the teacher surface is a **professional adult UI** — denser, scannable, optimized for working through a queue on a phone between classes.

### Edge & loading states
Show loading skeletons, friendly empty states, and offline retry banners so every mockup reads as a complete, production-ready screen.

### Output style
Make every screen realistic, polished, and easy for engineers to implement: complete navigation, cards, buttons, and believable, localization-ready copy following the vocabulary rules above.

---

## Feature Brief: Teacher Experience

A mobile command center for a classroom teacher (e.g., "Ms. Carter · Room 12 · Grade 5"): assign writing, monitor the class, review submissions with AI-prepared signals, and add human feedback on top.

## Screens to design

1. **Teacher dashboard** — greeting + class picker ("Period 2 · Grade 5 · 26 students"), today-at-a-glance cards: **Submissions to review (8)**, **Active assignments (3)**, **Class streak health** (e.g., "19 of 26 practiced this week"), needs-attention list (students with stalled drafts or missed practice, framed supportively: "Check in with Jordan — no practice in 4 days"), quick action **New assignment**.
2. **Assignments list** — active/draft/closed assignments with submission progress bars ("18 of 26 submitted"), due dates, skill focus tags, and per-assignment shortcuts to submissions.
3. **Create assignment** — form: title, writing prompt (multiline), class selector, due date, estimated time, difficulty (Easy/Moderate/Challenging), **skill focus** picker, **rubric focus** picker, optional canvas-template suggestion, and an AI assist that follows integrity rules — **"Help me brainstorm"** prompt ideas chip (suggests prompt directions; the teacher writes the prompt). CTAs: **Publish to class**, **Save draft**.
4. **Submissions queue** — list grouped by assignment: student name, submitted time, status (AI feedback ready / awaiting teacher review / returned), word count, rubric snapshot dots; sort/filter controls.
5. **Submission review** — student's writing (read-focused typography), the AI feedback it generated (Strength / Improvement / Next revision task) clearly labeled "AI coaching — review before it informs your feedback", rubric scoring control (Starting / Building / Meeting / Strong per criterion, tappable), teacher comment box with starter phrases ("Ask me a question"-style coaching stems), the "Coaching, not completion" safety note, CTAs **Return with feedback**, **Flag for conference**.
6. **Class progress** — class-level trends: skill heat strip across students × criteria (teal intensity), distribution chart per skill, instructional groups suggestion ("5 students ready for stronger transitions"), export/share.

## States to include
- **Empty:** "No class activity yet — Class writing progress will appear here."
- **Loading:** "Loading teacher dashboard — Preparing classes, assignments, and submissions."
- **Offline:** "Offline class data — Showing saved class data. New assignment publishing and comment updates sync when the connection returns."
- **Error:** calm retry pattern per screen ("Submissions did not load — Check your connection and try again.").

## Deliverable — design 3 distinct versions

Produce **3 complete versions**, labeled **Version A**, **Version B**, **Version C**, differing in workflow philosophy — not just color:

- **Version A — Queue-First:** the review queue is the home; dashboard metrics compress into a header strip; built for speed between classes.
- **Version B — Classroom Overview:** dashboard-led with rich class-health visualizations; review and assigning hang off the overview; built for planning periods.
- **Version C — Student-Centric:** organized around student cards/rosters; tap a student to see their work, growth, and needs across assignments; built for conferences and check-ins.

**What must stay constant across versions:** exact color tokens, "Coaching, not completion" safety note, AI-assist-with-teacher-control framing, rubric vocabulary (Starting/Building/Meeting/Strong), the 6 screens, required states, iPhone patterns.