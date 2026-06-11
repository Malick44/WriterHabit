# Personalized Plan Summary Screen Design Prompt

## Target User
Student (Grades 1–12)

## Goal
Design the final Personalized Plan Summary screen (step 6 of 6): a warm, celebratory reveal of the starter plan built from the student's choices, ending in a confident start CTA. The AI agent must generate 3 distinct design versions.

## Prompt

You are a senior product designer and mobile UI specialist.
Design a polished, realistic mobile screen for **WriterHabit AI** (onboarding step 6 of 6: Personalized Plan Summary). Follow the Daylight Glass system in `DESIGN.md`: light surfaces (`#F6FAFF` background, white cards), primary indigo `#2563EB`, teal `#14B8A6` for progress, reward yellow `#F59E0B` for celebration accents, soft salmon `#DC2626` for errors only. Subtle glassmorphism touches, 16–24px radii, modern high-readability typography. iPhone-style patterns with safe areas.

### Tone & Integrity Directives
- Celebratory but trustworthy — confetti-light, not casino. The plan is a learning plan, and the integrity promise is part of the reveal.
- **Safety note (real copy, must appear):** "WriterHabit will coach with hints, questions, and revision tasks. It will not write assignments for the student."

### Screen Purpose & Requirements
- **Progress:** Step indicator showing onboarding complete (6 of 6).
- **Copy (real product strings — use these):**
  - Title: "Here's your personalized plan!"
  - Subtitle: "We've built a plan to help you reach your goals."
- **Plan card ("Practice settings" — "This can change later as writing practice grows."):**
  - GRADE LEVEL: "Grade 5"
  - MAIN GOALS: goal chips, e.g., "Creative Writing", "Grammar", "Paragraphs"
  - DAILY PLAN: "10 minutes / day" + "5 days per week"
  - Coaching pace: from the confidence choice (e.g., "Friendly hints and simple steps")
- **First week focus:** "These goals shape the first set of practice cards." — 2–3 milestone rows with teal checks.
- **First assignment preview:** eyebrow "FIRST ASSIGNMENT PREVIEW", quote card: "Write a paragraph about a time you helped someone."
- **Safety note card:** the integrity copy above, calm indigo tint treatment (trust signal, not a warning).
- **CTA:** Primary "Start My First Assignment".
- **Loading state:** "Creating your plan — Building a starter plan from the choices you made." with skeleton plan card and anticipation cue ("Crafting your plan...").
- **Recovery state example:** "Plan is not ready yet — One or more required choices is missing." + "Review missing step".

---

### Task: Generate 3 Distinct Design Versions
Produce 3 complete versions, labeled **Version A**, **Version B**, **Version C** — meaningfully different in reveal structure, not just color:

1. **Version A — Plan Card Stack:** clean stacked cards (plan → first week → preview → safety note); calm, scannable, most conventional.
2. **Version B — Celebration Reveal:** soft confetti header moment with the plan presented as one elevated glass summary card and expandable sections; the warmest take.
3. **Version C — Roadmap:** a vertical path/timeline from "Today" through the first week milestones to the first assignment, plan settings as a compact header strip; skews Grades 6–12.

For each version, provide layout description, key styling values, loading/reveal states, and accessibility notes (announcement of completion, heading order, touch targets).

**Constant across versions:** exact color tokens, real product copy above, the safety note, first-assignment preview, loading and recovery states, iPhone patterns.
