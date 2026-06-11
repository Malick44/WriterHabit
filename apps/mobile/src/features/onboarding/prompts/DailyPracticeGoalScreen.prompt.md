# Daily Practice Goal Screen Design Prompt

## Target User
Student (Grades 1–12)

## Goal
Design a motivating Daily Practice Goal screen (step 5 of 6) where the student picks a daily rhythm. Motivation comes from habit-building warmth (streak preview, "Daily Rhythm"), not pressure. The AI agent must generate 3 distinct design versions.

## Prompt

You are a senior product designer and mobile UI specialist.
Design a polished, realistic mobile screen for **WriterHabit AI** (onboarding step 5 of 6: Daily Practice Goal). Follow the Daylight Glass system in `DESIGN.md`: light surfaces (`#F6FAFF` background, white cards), primary indigo `#2563EB`, teal `#14B8A6` for progress, reward yellow `#F59E0B` for streak/reward accents, soft salmon `#DC2626` for errors only. Subtle glassmorphism touches, 16–24px radii, modern high-readability typography. iPhone-style patterns with safe areas.

### Tone & Integrity Directives
- Encouraging, never pressuring: small goals are celebrated, bigger goals are not framed as "better".
- Reward yellow may appear here for the streak preview — its only approved use on this screen.

### Screen Purpose & Requirements
- **Progress:** Step indicator for Step 5 of 6.
- **Copy (real product strings — use these):**
  - Title: "How much time can you dedicate each day?"
  - Subtitle: "Consistency is the key to improvement!"
  - Section label: "Choose a practice rhythm"
  - Flexibility note: "You can change this later as your writing routine grows."
- **Goal options (single select — real labels + descriptions):**
  - "5 minutes / day" — "Quick practice"
  - "10 minutes / day" — "Steady progress" (badge: **Recommended**)
  - "15 minutes / day" — "Great habit"
  - "20 minutes / day" — "Make big growth"
  - Selected state: `#DBEAFE` tint + `#2563EB` border.
- **Selected summary card:** eyebrow "Daily target", title "10 minutes each day", with a gentle streak preview ("A steady Daily Rhythm builds your streak" + small flame/star in reward yellow).
- **CTAs:** Primary "Continue", secondary "Back".
- **Validation example:** "Choose a daily practice goal." in calm salmon treatment.

---

### Task: Generate 3 Distinct Design Versions
Produce 3 complete versions, labeled **Version A**, **Version B**, **Version C** — meaningfully different in selection mechanics, not just color:

1. **Version A — Rhythm Cards:** four stacked option rows with minutes, description, and Recommended badge; summary card pinned above the CTA.
2. **Version B — Dial / Stepper:** a friendly central minutes display with stepper or arc control snapping to 5/10/15/20; description and streak preview update live beneath.
3. **Version C — Habit Ladder:** options as gentle ascending tiles (small → big) with the streak preview growing alongside; playful but calm, skews Grades 1–8.

For each version, provide layout description, key styling values, selected/recommended states, and accessibility notes (single-select semantics, control alternatives for the dial, labels).

**Constant across versions:** exact color tokens, real product copy above, Recommended badge on 10 minutes, flexibility note, step indicator, validation state, iPhone patterns.
