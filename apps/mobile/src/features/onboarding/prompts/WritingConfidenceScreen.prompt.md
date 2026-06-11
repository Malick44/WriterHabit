# Writing Confidence Screen Design Prompt

## Target User
Student (Grades 1–12)

## Goal
Design an empathetic Writing Confidence screen (step 4 of 6) that asks how writing feels right now so the coach can pace its support. It must feel safe and judgment-free. The AI agent must generate 3 distinct design versions.

## Prompt

You are a senior product designer and mobile UI specialist.
Design a polished, realistic mobile screen for **WriterHabit AI** (onboarding step 4 of 6: Writing Confidence). Follow the Daylight Glass system in `DESIGN.md`: light surfaces (`#F6FAFF` background, white cards), primary indigo `#2563EB`, teal `#14B8A6` for progress, reward yellow `#F59E0B`, soft salmon `#DC2626` for errors only. Subtle glassmorphism touches, 16–24px radii, modern high-readability typography. iPhone-style patterns with safe areas.

### Tone & Integrity Directives
- Emotionally intelligent and judgment-free: every option is framed positively; "I need help starting" must look just as inviting as "I feel confident".
- Color may warm gently across the scale (soft yellow tint → teal tint) but stays within the token palette — no red anywhere on this screen.

### Screen Purpose & Requirements
- **Progress:** Step indicator for Step 4 of 6.
- **Copy (real product strings — use these):**
  - Title: "How does writing feel right now?"
  - Subtitle: "Choose the answer that feels closest. This only helps WriterHabit coach at the right pace."
- **Confidence options (single select — real labels + descriptions):**
  - "I need help starting" — "I want simple steps and friendly hints."
  - "I can do some parts" — "I want help putting my ideas together."
  - "I am getting better" — "I want practice revising and making writing stronger."
  - "I feel confident" — "I want challenges that help me keep improving."
  - Selected state: `#DBEAFE` tint + `#2563EB` border; friendly expressive icons (not childish emoji for older grades).
- **CTAs:** Primary "Continue", secondary "Back".
- **Validation example:** "Choose how writing feels right now." in calm salmon treatment.

---

### Task: Generate 3 Distinct Design Versions
Produce 3 complete versions, labeled **Version A**, **Version B**, **Version C** — meaningfully different in interaction model, not just color:

1. **Version A — Option Cards:** four stacked cards with icon + label + description; the calmest, most accessible take.
2. **Version B — Gentle Scale:** a vertical or stepped scale where the four options sit along a softly tinted gradient track (warm yellow tint → teal tint), selection slides a friendly indicator; descriptions appear for the focused option.
3. **Version C — Expressive Tiles:** 2×2 grid of illustrated mood-style tiles with the description revealed in a summary card below the grid after selection; warmest for Grades 1–5.

For each version, provide layout description, key styling values, selected/focus states, and accessibility notes (single-select semantics, no color-only meaning, VoiceOver labels).

**Constant across versions:** exact color tokens, real product copy above, positive framing of all four options, step indicator, validation state, iPhone patterns.
