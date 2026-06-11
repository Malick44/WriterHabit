# Design Prompt — AI Coach Drawer (WriterHabit AI)

> Paste this entire file into Claude design as one prompt. It produces a prototype of the **AI coach** experience in 3 distinct versions.

---

## Role & Design Guide (applies to every screen and every version)

You are a senior product designer and mobile UI specialist. Design polished, realistic mobile app screens for **WriterHabit AI**, an AI writing assistant for Grades 1–12 students. Tagline direction: *Build better writing skills every day.* The app must feel educational, trustworthy, premium, friendly, and implementation-ready. Use iPhone-style mobile UI patterns (sheets, drawers, safe areas) unless stated otherwise.

### Academic integrity & coaching tone (non-negotiable)
WriterHabit AI is a learning app, not a cheating tool. The AI coach helps students think, plan, and revise their own work. **This feature is the heart of that promise — the design must make "coaching, not completion" visible.**
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
- Light surfaces with subtle glassmorphism touches (the drawer itself is a great glass candidate), 16–24px radii, soft shadows. No generic primary red/green/blue.
- **Typography:** modern, high-readability hierarchy; sizes and weights adapt to grade band.

### Grade-band adaptation
- **Grades 1–5:** "Pick one small kind of help. The coach asks questions and gives hints so the writing stays yours."
- **Grades 6–8:** "Choose a coaching move for planning, sentence checks, questions, or revision decisions."
- **Grades 9–12:** "Use coaching to test reasoning, improve structure, or choose a focused revision move."

### Edge & loading states
Show loading skeletons, friendly empty states, and offline retry banners so every mockup reads as a complete, production-ready screen.

### Output style
Make every screen realistic, polished, and easy for engineers to implement: complete navigation, cards, buttons, and believable, localization-ready copy following the vocabulary rules above.

---

## Feature Brief: AI Coach

A drawer/sheet that opens over the writing workspace. The student picks one **coaching move**; the coach responds with a structured card — never a rewritten draft. Persistent safety reminder (real copy): *"The coach helps you think and revise; it does not write the assignment for you."*

The seven coaching moves (real labels + descriptions):
1. **Give me a hint** — "Get a small hint that points you back to the prompt."
2. **Help me brainstorm** — "Get planning choices while keeping the final writing in your own words."
3. **Check my sentence** — "Check one sentence-level issue without replacing your draft."
4. **Explain this mistake** — "Understand one mistake pattern so you can fix it yourself."
5. **Help me revise** — "Choose one focused revision task for your current draft."
6. **Suggest a stronger word** — "Get help choosing a more precise word that still sounds like you."
7. **Ask me a question** — "Ask one guiding question that helps you decide the next writing move."

## Screens to design

1. **Coach drawer — move picker:** bottom sheet titled "AI coach" over a dimmed workspace, grade-band description line, the 7 moves as tappable cards with icon + label + description, safety reminder pinned at the bottom, **Close coach**.
2. **Coach response card:** structured response with labeled sections **Question / Strength / Improvement / Next step** (e.g., for "Check my sentence": draft excerpt quoted, one issue explained, a "Your action" line). Success footer: "Coaching ready — Use the next step yourself, then revise the draft in your own words."
3. **Processing state:** "Preparing coaching — Checking the prompt, your draft excerpt, and the safety rules." with anticipation animation ("Reading your story...").
4. **Safety-blocked state:** "Use coaching help — WriterHabit can give hints, questions, explanations, and revision tasks, but it cannot replace your thinking." + **Choose a safe move**. Calm indigo treatment — this is guidance, not an error.

## States to include
- **Empty:** "Choose a coaching move — Start with a hint, a brainstorm, a question, or a sentence check when you have text."
- **Needs text:** "Add your own text first — This coaching move needs a sentence or draft excerpt to review." + **Choose another move**.
- **Error:** "Coach did not respond — Your draft is unchanged. Try again, or keep writing and return to coaching later."
- **Offline:** "Coach is offline — Keep drafting and saving on this device." + **Back to choices**.

## Deliverable — design 3 distinct versions

Produce **3 complete versions**, labeled **Version A**, **Version B**, **Version C**, differing in interaction model — not just color:

- **Version A — Glass Sheet:** half-height glassmorphism bottom sheet, 7 moves as a 2-column icon grid, response expands the sheet to full height.
- **Version B — Coach Persona:** friendly coach avatar at top, moves as conversational chips, response styled as a coach "card" handed to the student; warmer, skews Grades 1–5 with a read-aloud button on the response.
- **Version C — Study Sidebar:** mature full-height panel (skews 9–12), moves as a compact list, response with structured Strength/Improvement/Next-step rows and citation of the quoted excerpt; productivity tone.

**What must stay constant across versions:** exact color tokens, the 7 approved moves with their exact labels, the pinned safety reminder, structured (non-chat, non-draft-writing) responses, required states, iPhone patterns.
