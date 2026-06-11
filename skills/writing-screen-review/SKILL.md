---
name: writing-screen-review
description: Review WriterHabit's core student-facing screens — the writing workspace, handwriting canvas, AI review/feedback, and revision screens — for correctness, age-appropriate UX, accessibility, draft-safety, and academic-integrity guardrails. Use when building or reviewing any screen under features/writing-workspace, features/canvas, or features/feedback-review, or any Expo Router route a student spends sustained time on. Output should flag draft-loss risks, missing states, integrity/safety gaps, and accessibility issues with concrete fixes.
---

# Writing Screen Review

The screens where a student actually writes, draws, and revises are the heart of
WriterHabit. A bug here loses a child's work, confuses a young user, or quietly lets the
AI cross from coaching into ghostwriting. This skill makes review of those screens a
deliberate checklist rather than a glance.

## When to Use

Use this skill when building or reviewing:

- `features/writing-workspace/screens/*` — `WritingWorkspaceScreen`, `OutlineBuilderScreen`
- `features/canvas/screens/*` — `HandwritingCanvasScreen`, `CanvasHomeScreen`,
  `CanvasTemplatePickerScreen`, `CanvasAttachmentScreen`
- `features/feedback-review/screens/*` — `AiReviewLoadingScreen`,
  `FeedbackSummaryScreen`, `RevisionScreen`, `CompletionCelebrationScreen`
- `features/assignments` detail/submission screens
- any route a student occupies for minutes at a time with unsaved input

Do **not** use this skill for non-writing surfaces (teacher dashboard tables, parent
reports, settings lists) unless they hold unsaved user input.

## Review Dimensions

Review every in-scope screen against these dimensions, in priority order.

### 1) Draft safety (highest priority)
Students lose work the way adults don't — by closing the app mid-sentence, switching to
canvas, or having the device sleep. Verify:

- Typed text autosaves to local persistent storage (AsyncStorage/SecureStore) on a
  debounce, not only on an explicit Save.
- Canvas strokes autosave locally **before** backend sync (`local_only -> saving ->
  saved -> sync_failed`), and drawing is never blocked by a save.
- Navigating away, backgrounding, or app kill does not drop the draft — there is a
  restore path on return.
- `sync_failed` is surfaced to the student and retried; the local copy is never
  discarded on a failed sync.
- Switching between typed workspace and canvas for the same assignment preserves both.

### 2) Screen states
Every screen must handle, with an explicit recovery path:

- **Loading** — e.g. `AiReviewLoadingScreen` while feedback is generated; no infinite
  spinner, show a sense of progress and a way to leave.
- **Empty** — first-open writing workspace, no strokes on canvas, no assignments today.
- **Error** — AI review failed, sync failed, network down; offer retry, keep the draft.
- **Offline** — canvas and typed drafts must work offline (per canvas architecture);
  the screen should degrade gracefully, not block.

### 3) Academic-integrity & AI-coach guardrails
On any screen that surfaces the AI coach (workspace, review, revision):

- Never render a "Write it for me", "Finish my essay", "Give me the answer", or
  "Generate final draft" CTA. Allowed CTAs: "Give me a hint", "Help me brainstorm",
  "Check my sentence", "Explain this mistake", "Help me revise", "Suggest a stronger
  word", "Ask me a question".
- AI output is framed as coaching (one strength, one improvement, one next action), not
  a polished replacement for the student's text.
- Revision tasks ask the student to make the change; they do not auto-apply a rewrite of
  the whole response.
- Feedback is grade-level appropriate in tone and vocabulary (see grade bands below).

### 4) Age-appropriate UX (Grades 1–12)
The same screen serves a 6-year-old and a 17-year-old. Verify the screen respects the
student's grade band:

- **Grades 1–2**: large touch targets, short sentences, one action at a time, optional
  read-aloud, warm tone.
- **Grades 3–5**: simple labels, focus on sentence completeness and basics.
- **Grades 6–8**: paragraph/structure-oriented affordances.
- **Grades 9–12**: thesis/argument/citation-level tools.
- No tiny tap targets, no dense walls of text, no jargon for younger bands.

### 5) Accessibility
- Touch targets meet minimum size (especially canvas toolbar tools and onboarding-style
  selection cards).
- Text scales with system font settings; layouts don't clip when enlarged.
- Interactive elements have accessibility labels/roles; canvas tools are reachable.
- Color is not the only signal for state (sync status, errors, selected tool).
- Respects the accessibility settings the app already exposes
  (`AccessibilitySettingsScreen`).

### 6) Correctness & data contracts
- Screens are thin and import from the feature folder (route files just re-export the
  feature screen).
- Server state via TanStack Query; local UI state via component state/Zustand; unsaved
  drafts via persistent storage — not mixed up.
- The AI request carries the full `AiCoachContext` (gradeLevel, writingLevel,
  assignmentType, skillFocus, prompt, studentText/canvasText) so feedback is calibrated.
- Submission lifecycle transitions are valid; you can't submit an empty assignment or
  double-submit.

## Procedure

For each in-scope screen:

1. **Trace the draft**: where does input live, when is it persisted, what happens on
   background/kill/navigate-away, and how is it restored?
2. **Enumerate states**: confirm loading / empty / error / offline each render and each
   recover.
3. **Audit AI surfaces**: every coach CTA and rendered AI output against the integrity
   rules.
4. **Check the grade band**: is the UX appropriate across Grades 1–12, or only tuned for
   one age?
5. **Sweep accessibility**: targets, scaling, labels, non-color signals.
6. **Verify contracts**: state placement, query usage, AI context completeness,
   submission lifecycle.

## Required Output Format

End with a **Screen Review** section:

1. **Screen(s) reviewed**
2. **Draft-safety findings** — autosave, sync states, restore path, loss risks
3. **Missing/weak states** — loading, empty, error, offline
4. **Integrity & safety findings** — disallowed CTAs, ghostwriting risk, grade tone
5. **Accessibility findings**
6. **Correctness/contract findings**
7. **Concrete fixes** — specific, not generic

## Example Mini-Findings

Bad:
- `WritingWorkspaceScreen` only persists the draft when the student taps Save; closing
  the app mid-paragraph loses everything.

Better:
- Debounced autosave to local storage on every change, with restore-on-return.

Bad:
- `RevisionScreen` shows a "Generate final draft" button that replaces the student's
  text with AI output.

Better:
- "Help me revise" returns one targeted suggestion; the student applies the edit.

Bad:
- `AiReviewLoadingScreen` spins forever on network failure with no exit.

Better:
- Timeout → error state with retry, draft preserved, and a way back to the workspace.

## Success Criteria

- No path loses a student's typed or drawn work.
- Every screen handles loading, empty, error, and offline with recovery.
- No screen exposes a ghostwriting CTA or grade-inappropriate tone.
- Touch targets, scaling, and labels are accessible across the Grades 1–12 range.
- The final response includes a concrete Screen Review section.
