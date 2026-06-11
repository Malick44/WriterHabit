# Design Prompt — Writing Workspace (WriterHabit AI)

> Paste this entire file into Claude design as one prompt. It produces a prototype of the **writing workspace** in 3 distinct versions.

---

## Role & Design Guide (applies to every screen and every version)

You are a senior product designer and mobile UI specialist. Design polished, realistic mobile app screens for **WriterHabit AI**, an AI writing assistant for Grades 1–12 students. Tagline direction: *Build better writing skills every day.* The app must feel educational, trustworthy, premium, friendly, and implementation-ready. Use iPhone-style mobile UI patterns (status bar, safe areas, keyboard-aware layout) unless stated otherwise.

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
- **Typography:** modern, high-readability hierarchy; the editor itself uses a comfortable serif-or-humanist reading face at generous line height.

### Grade-band adaptation
- **Grades 1–5:** larger friendly controls, simple wording, fewer visible metrics, audio/read-aloud affordances.
- **Grades 6–8:** structured learning cards, skill progress, paragraph structure support.
- **Grades 9–12:** mature layout, essay planning tools, rubric detail, productivity-focused UI.

### Edge & loading states
Show loading skeletons, friendly empty states, and offline retry banners so every mockup reads as a complete, production-ready screen.

### Output style
Make every screen realistic, polished, and easy for engineers to implement: complete navigation, cards, buttons, and believable, localization-ready copy following the vocabulary rules above.

---

## Feature Brief: Writing Workspace

The core writing surface. The student moves through a guided arc — **Understand → Plan → Draft → Coach → Revise → Submit** (real product section labels: Understand / "Read the task before you draft", Draft / "Write the response yourself, then revise it", Coach, Plan/canvas, Revise/rubric checklist, Submit). The draft is always the student's own words; the coach never writes for them.

## Screens to design

1. **Writing workspace (main)** — header "Write" with assignment title, autosave status pill cycling **Saved / Saving / Unsaved / Save failed**, and an **AI Coach** button. Content:
   - Collapsible **Assignment prompt** card ("Understand — Read the task before you draft").
   - **Your draft** editor: placeholder "Start your draft here...", live metrics bar "240 words · 14 sentences · 3 paragraphs".
   - **Coach is ready** entry card: "Open the coach when you want a hint, a brainstorming question, a sentence check, or a revision task." with chips **Give me a hint**, **Help me brainstorm**, **Help me revise**.
   - **Planning canvas** attachment row: "Planning canvas · 2 pages" with **Open canvas** / **Add canvas page**.
   - **Revision checklist** card: "Use this checklist to revise your own draft before submitting." (e.g., 2 of 3, teal progress).
   - **Submit panel**: "Ready for review? — Submit when the draft includes your own thinking and you have checked one revision goal." Primary **Submit for review**, secondary **Save draft**. Disabled-state hint when draft is empty: "Type your own draft before submitting."
2. **Outline builder** — "Outline builder": drag-ordered outline cards (Hook → Main idea → Detail 1/2/3 → Wrap-up for Grade 5; Claim → Evidence → Analysis → Counterclaim → Conclusion for Grade 9–12), add-section button, coach chip **Help me brainstorm** per section, and a **Map Out → Start drafting** CTA that carries the outline into the editor.

## States to include
- **Loading:** "Opening your draft — Checking the assignment and restoring saved writing."
- **Empty draft:** "Start with your idea — Type a first sentence or plan note before submitting."
- **Offline:** "Offline draft mode — You can keep drafting. Autosave uses this device until the assignment can refresh."
- **Autosave recovery:** "Autosave needs attention — Your latest writing is still on screen. Try saving again before you leave." + **Save again**.
- **Submit success:** "Submitted — Your draft is on its way to feedback review."

## Deliverable — design 3 distinct versions

Produce **3 complete versions**, labeled **Version A**, **Version B**, **Version C**, differing in editor architecture — not just color:

- **Version A — Focused Scroll:** single scroll column; prompt collapses to a slim glass header pill while drafting; coach as floating action.
- **Version B — Staged Tabs:** segmented stages (Understand · Draft · Revise · Submit) across the top; each stage is a clean focused panel; progress dots show stage completion.
- **Version C — Split Coach:** editor on top, persistent slim coach dock at the bottom with the approved chips; rubric checklist slides in from the right as a glass sheet.

**What must stay constant across versions:** exact color tokens, academic-integrity copy rules (coach chips only from the approved list), autosave states, the workspace modules and the outline builder, required states, iPhone patterns.
