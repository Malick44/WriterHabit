# Writing Goals Screen Design Prompt

## Target User
Student (Grades 1–12)

## Goal
Design a friendly, motivating Writing Goals screen (step 3 of 6) with multi-select goal cards and a clear selection counter with a gentle limit state. The AI agent must generate 3 distinct design versions.

## Prompt

You are a senior product designer and mobile UI specialist.
Design a polished, realistic mobile screen for **WriterHabit AI** (onboarding step 3 of 6: Writing Goals). Follow the Daylight Glass system in `DESIGN.md`: light surfaces (`#F6FAFF` background, white cards), primary indigo `#2563EB`, teal `#14B8A6` for progress, reward yellow `#F59E0B`, soft salmon `#DC2626` for errors only. Subtle glassmorphism touches, 16–24px radii, modern high-readability typography. iPhone-style patterns with safe areas.

### Tone & Integrity Directives
- Educational, trustworthy, premium, friendly — goals are about the student's own growth, never shortcuts.
- When the selection limit is reached, remaining options quiet down gracefully (reduced opacity, soft "3 of 3 selected" note) — no locks, alarms, or punitive styling.

### Screen Purpose & Requirements
- **Progress:** Step indicator for Step 3 of 6.
- **Copy (real product strings — use these):**
  - Title: "What are your writing goals?"
  - Subtitle: "Choose all that you'd like to focus on."
  - Counter: "2 of 3 goals selected"
- **Goal options (multi-select cards/chips — real labels + descriptions):**
  - "Practice creative writing" — "Write stories and express your ideas"
  - "Improve grammar" — "Use correct grammar and punctuation"
  - "Write paragraphs" — "Organize ideas and write better paragraphs"
  - "Essays" — "Practice thesis, evidence, organization, and revision."
  - "Stronger sentences" — "Make sentences clearer, smoother, and more specific."
  - "School assignments" — "Plan and revise your own assigned writing."
  - "Spelling" — "Build confidence with commonly missed words."
  - "Improve handwriting" — "Write more clearly and neatly"
  - "Test prep" — "Practice focused responses with clear structure."
  - Selected state: `#DBEAFE` tint + `#2563EB` border + check affordance; per-category icon accents stay within the token palette (indigo/teal/yellow tints).
- **CTAs:** Primary "Continue", secondary "Back".
- **Validation example:** "Choose at least one writing goal." in calm salmon treatment.

---

### Task: Generate 3 Distinct Design Versions
Produce 3 complete versions, labeled **Version A**, **Version B**, **Version C** — meaningfully different in layout and selection mechanics, not just color:

1. **Version A — Goal Card List:** full-width cards with icon, label, and description; checkmark trailing; counter pinned under the header.
2. **Version B — Chip Cloud:** compact selectable chips in a wrapping cloud grouped by theme (Create / Structure / Polish), descriptions surfacing on the selected chips; densest and fastest.
3. **Version C — Two-Column Tiles:** square icon-forward tiles in a 2-column grid, friendly and tappable for younger students, counter as a teal progress pill ("2 of 3").

For each version, provide layout description, key styling values, selected/limit-reached states, and accessibility notes (multi-select semantics, labels, touch targets).

**Constant across versions:** exact color tokens, real product copy above, the 3-goal limit with graceful limit state, step indicator, validation state, iPhone patterns.
