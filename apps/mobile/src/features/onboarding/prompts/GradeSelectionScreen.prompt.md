# Grade Selection Screen Design Prompt

## Target User
Student (Grades 1–12)

## Goal
Design a clear, friendly Grade Selection screen (step 2 of 6) that groups elementary, middle, and high school grades and previews how the app adapts to each band. The AI agent must generate 3 distinct design versions.

## Prompt

You are a senior product designer and mobile UI specialist.
Design a polished, realistic mobile screen for **WriterHabit AI** (onboarding step 2 of 6: Grade Selection). Follow the Daylight Glass system in `DESIGN.md`: light surfaces (`#F6FAFF` background, white cards), primary indigo `#2563EB`, teal `#14B8A6` for progress, reward yellow `#F59E0B`, soft salmon `#DC2626` for errors only. Subtle glassmorphism touches, 16–24px radii, modern high-readability typography. iPhone-style patterns with safe areas.

### Tone & Integrity Directives
- Educational, trustworthy, premium, friendly — never neon or sci-fi.
- The grade choice should feel welcoming, not like a placement test.

### Screen Purpose & Requirements
- **Progress:** Step indicator for Step 2 of 6.
- **Copy (real product strings — use these):**
  - Title: "What grade are you in?"
  - Subtitle: "This helps us choose the right content for you."
- **Grade bands (grouped, with band descriptions previewing the adaptation):**
  - **Elementary (Grades 1-5)** — "Larger controls, simple wording, and friendly writing practice."
  - **Middle School (Grades 6-8)** — "Paragraph support, revision practice, and structured goals."
  - **High School (Grades 9-12)** — "Essay planning, rubric detail, evidence, tone, and style support."
  - Individual grade chips ("Grade 1" … "Grade 12") within or beneath each band; selected grade gets `#DBEAFE` tint + `#2563EB` border.
  - Adaptive visuals: the elementary zone reads friendlier and larger; the high school zone reads cleaner and denser — a live preview of grade adaptation.
- **CTAs:** Primary "Continue", secondary "Back".
- **Validation example:** "Choose a grade." in calm salmon treatment.

---

### Task: Generate 3 Distinct Design Versions
Produce 3 complete versions, labeled **Version A**, **Version B**, **Version C** — meaningfully different in layout and interaction, not just color:

1. **Version A — Band Sections:** three labeled sections stacked vertically, grade chips wrapping inside each; clearest scannability.
2. **Version B — Band-First Cards:** pick a band card first (with its description), grades expand inline as a chip row; progressive disclosure keeps the screen calm.
3. **Version C — Grade Grid:** a 3–4 column grid of grade tiles with subtle band color-zoning (indigo tints deepening with age) and band legends; fastest single-tap path.

For each version, provide layout description, key styling values, selected/expanded states, and accessibility notes (labels, hit areas, dynamic type).

**Constant across versions:** exact color tokens, real product copy above, the three band descriptions, step indicator, validation state, iPhone patterns.
