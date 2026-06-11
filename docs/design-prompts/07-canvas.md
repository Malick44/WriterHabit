# Design Prompt — Canvas (WriterHabit AI)

> Paste this entire file into Claude design as one prompt. It produces a prototype of the **canvas** feature (handwriting & planning) in 3 distinct versions.

---

## Role & Design Guide (applies to every screen and every version)

You are a senior product designer and mobile UI specialist. Design polished, realistic mobile app screens for **WriterHabit AI**, an AI writing assistant for Grades 1–12 students. Tagline direction: *Build better writing skills every day.* The app must feel educational, trustworthy, premium, friendly, and implementation-ready. Use iPhone-style mobile UI patterns (status bar, safe areas, toolbars) unless stated otherwise.

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
- **Surfaces & text:** app background `#F6FAFF`, canvas surface `#F8FAFC`, cards `#FFFFFF`/`#FCFEFF`, text slate `#0F172A` / `#475569` / muted `#94A3B8`
- Light surfaces with subtle glassmorphism touches (floating toolbars are a great glass candidate), 16–24px radii, soft shadows. No generic primary red/green/blue.
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

## Feature Brief: Canvas

A freeform, offline-first space to handwrite, draw, outline, and plan — then attach pages to assignments. Tagline copy (real): *"Plan, handwrite, annotate, and attach your own work."* Pages are saved locally ("Saved canvas pages — Open a page to keep planning or attach it to an assignment", stroke count shown as "128 marks", attached pages get an **Attached** label).

## Screens to design

1. **Canvas home** — title "Canvas", subtitle "Plan, handwrite, annotate, and attach your own work." Grid/list of saved canvas page thumbnails (mix of handwriting, mind maps, story maps) with template name, "{n} marks", relative time, and Attached labels. Prominent **New canvas** create button.
2. **Template picker** — "Choose a canvas template — Start with the planning page that fits your writing task." Template cards with mini-previews: **Blank page**, **Lined handwriting**, **Story map** (beginning/middle/end), **Mind map / web**, **Paragraph planner**, **Essay outline** (9–12). Tap-to-use ("Tap to use"), with grade-band hinting on which templates suit the student.
3. **Handwriting canvas (editor)** — the drawing surface on `#F8FAFC` with a floating glass toolbar: pen, highlighter, eraser, color dots (indigo, teal, slate, yellow), stroke width, undo/redo, page indicator ("Page 2 of 3"), add page. Header shows autosave pill and a **Done** action. Show believable hand-drawn content (a story map with handwriting).
4. **Attach to assignment** — sheet listing the student's active assignments with thumbnails of selected pages, confirmation "Attach to assignment", and a success toast "Attached — your plan is linked to The Magic Forest Adventure."

## States to include
- **Empty home:** "No canvas work yet — Create handwriting, drawing, or planning pages here." + **New canvas**.
- **Loading:** "Loading canvas work — Checking saved canvas pages on this device."
- **Offline:** "Offline canvas mode — Saved canvas pages are available on this device. New changes stay local until sync is ready." + **Check again**.
- **Template creation error:** "Template did not open — Try the template again. No canvas work was lost."

## Deliverable — design 3 distinct versions

Produce **3 complete versions**, labeled **Version A**, **Version B**, **Version C**, differing in tool ergonomics and layout — not just color:

- **Version A — Studio:** minimal chrome, edge-anchored slim glass toolbar, thumbnails in a masonry grid; feels like a premium sketch app tuned for school.
- **Version B — Notebook:** skeuomorphic-lite paper feel (subtle lined/dot paper), bottom toolbar with big labeled tools, page-flip affordance; skews Grades 1–5.
- **Version C — Planner:** template-first IA — home leads with "Map Out" planning templates and recent plans grouped by assignment; toolbar includes text/sticky-note tools; skews 6–12.

**What must stay constant across versions:** exact color tokens, academic-integrity copy rules, the 4 screens, offline-first messaging, required states, iPhone patterns.
