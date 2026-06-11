# Role Selection Screen Design Prompt

## Target User
Student (Grades 1–12) / Parent / Teacher

## Goal
Design a warm, trustworthy, premium Role Selection screen for onboarding (step 1 of 6). It should feel like a friendly welcome into a learning space — educational, calm, and implementation-ready. The AI agent must generate 3 distinct design versions.

## Prompt

You are a senior product designer and mobile UI specialist.
Design a polished, realistic mobile screen for **WriterHabit AI** (onboarding step 1 of 6: Role Selection). Follow the Daylight Glass system in `DESIGN.md`: light surfaces (`#F6FAFF` background, white cards), primary indigo `#2563EB`, teal `#14B8A6` for progress, reward yellow `#F59E0B`, soft salmon `#DC2626` for errors only. Subtle glassmorphism touches, 16–24px radii, modern high-readability typography. iPhone-style patterns with safe areas.

### Tone & Integrity Directives
- Educational, trustworthy, premium, friendly — never neon, dark-sci-fi, or gamer-coded.
- Coaching, not completion: the screen may reference the coach only in approved terms ("a coach that asks questions, never writes for you").
- Microcopy follows the WriterHabit voice: warm action verbs, calm recovery, anticipation cues.

### Screen Purpose & Requirements
- **Progress:** Step indicator for Step 1 of 6 (segmented bar or dots in `#2563EB`).
- **Copy (real product strings — use these):**
  - Title: "I'm here as a..."
  - Subtitle: "We'll personalize the experience just for you."
- **Role cards (single select):**
  - **Student** — "Improve my writing and skills"
  - **Parent** — "Support my child's writing journey"
  - **Teacher** — "Help my students become better writers"
  - Selected state: `#DBEAFE` tint fill with `#2563EB` border; friendly role illustrations/icons; 44px+ touch targets (larger for young students).
- **CTAs:**
  - Primary: "Continue" (solid indigo, disabled until a role is chosen).
  - Secondary: "Sign out" (quiet text button — calm, not alarming).
- **Validation example:** inline note "Choose how you are using WriterHabit." in salmon tint, calm tone.

---

### Task: Generate 3 Distinct Design Versions
Produce 3 complete versions, labeled **Version A**, **Version B**, **Version C** — meaningfully different in layout and component style, not just color swaps:

1. **Version A — Calm Cards:** three stacked full-width cards with illustrations on the left, generous whitespace, centered header.
2. **Version B — Glass Welcome:** soft gradient hero band with a translucent glass sheet holding the role cards; the most premium take.
3. **Version C — Friendly Grid:** large square role tiles in a 1×3 or 2+1 grid with big icons and rounded shapes; tuned for younger users and family feel.

For each version, provide layout description, key styling values (colors, radii, shadows, type sizes), selected/disabled states, and accessibility notes (labels, touch targets, contrast).

**Constant across versions:** exact color tokens, real product copy above, integrity tone, step indicator, loading/disabled/validation states, iPhone patterns.
