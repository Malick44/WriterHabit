Build a reusable Expo / React Native text action bar component for WriteWise, inspired by the attached image.

Goal:
Create a compact floating action bar that can be embedded anywhere coaching text appears across the app — AI coach messages, feedback summary cards, hints, rubric notes, brainstorm suggestions, and revision-task descriptions. It lives in the shared layer so any feature can drop it under a block of text.

Where it lives:
- Place the shared component under apps/mobile/src/shared/components/ (e.g. shared/components/text/TextActionBar.tsx), alongside existing shared primitives like shared/components/buttons/PrimaryButton.tsx and shared/components/cards/InfoCard.tsx.
- It is feature-agnostic shared UI; do not put it inside a single feature folder.
- The first real consumer is the AI coach surface (features/ai-coach/components/AiCoachDrawer.tsx) and feedback-review cards.

Visual target:
- Match the attached reference closely.
- The component should look like a rounded capsule / pill.
- Inside it, render 5 icon-only actions laid out horizontally with balanced spacing:
  1. thumbs up
  2. thumbs down
  3. read-aloud (speaker icon — supports the Grades 1–2 optional read-aloud requirement)
  4. copy
  5. more / overflow
- Style should feel premium, minimal, calm, and age-appropriate for a Grades 1–12 student audience.
- Use subtle elevation, soft corners, generous touch affordance (younger students need larger targets).
- Structure it so theming can be swapped later; do not hardcode a single dark/light look.

Theme:
- Use the project's design tokens from apps/mobile/src/design/tokens/ (colors, spacing, radius). Do not introduce raw hex values, arbitrary spacing, or one-off radii in the component.
- Use radius.full for the pill, spacing.* for gaps and padding, and colors.* for surfaces, icons, and disabled states.

Architecture requirements:
Separate UI from business logic, following WriteWise's layering (route file -> feature screen -> components -> hooks -> services).

Implement this in 3 layers:
1. Presentational UI component (shared/components/text/TextActionBar.tsx)
   - Pure visual component
   - No data fetching, no clipboard calls, no analytics, no toasts
   - No feature-specific logic
   - Receives props only

2. Controller / hook
   - Encapsulates interaction logic: action states, callbacks, loading flags, disabled logic, optimistic state if needed
   - May integrate clipboard, coach-feedback submission (was-this-helpful), read-aloud, analytics, or an overflow menu
   - Reusable across features (ai-coach, feedback-review, progress)

3. Feature usage example
   - Show how a screen or coaching block composes the controller + presentational component
   - Use a realistic AI coach / feedback example, minimal

Technical constraints:
- Expo + React Native + TypeScript, strictly typed, no any
- Keep code minimal and production-quality; avoid over-engineering; prefer a small API surface
- Make it easy to drop under any coaching text block; support app-wide reuse
- Accessible touch targets of at least 44x44 (prefer larger for younger grades)
- Provide accessibility labels for every action
- Support disabled and loading states
- The component must not assume a specific text source or feature
- Use @expo/vector-icons (already a dependency) for icons
- Do not mix feature-specific business rules into the visual component

Academic-integrity note (WriteWise-specific):
- The action bar attaches to coaching output (hints, feedback, suggestions), never to a generated full essay or final answer — the AI coach does not produce those.
- "Copy" copies the coaching text (e.g. a hint or a stronger-word suggestion); it must not become a path to copy a ghostwritten answer.
- "Read-aloud" is for accessibility/young learners; route it through the controller's handler, not the UI.

Functional API expectations:
Design a reusable API similar to this intent, but improve it if needed:

type TextActionBarAction = 'like' | 'dislike' | 'readAloud' | 'copy' | 'more';

type TextActionBarProps = {
  onLike?: () => void;
  onDislike?: () => void;
  onReadAloud?: () => void;
  onCopy?: () => void;
  onMore?: () => void;
  disabledActions?: TextActionBarAction[];
  loadingActions?: TextActionBarAction[];
  variant?: 'floating' | 'inline';
  size?: 'sm' | 'md';
  testID?: string;
};

Hook / controller expectations:
Create a hook or controller like:
- useTextActionBarController(...)
or
- createTextActionBarActions(...)

It should:
- accept the source text and optional metadata
- expose clean action handlers
- isolate side effects
- allow the UI component to stay completely dumb

Suggested input shape for the controller:
- text: string
- textId?: string
- sourceType?: 'coach-message' | 'feedback' | 'hint' | 'revision-task' | 'brainstorm' | string
- onLike?
- onDislike?
- onReadAloud?
- onMore?
- enableCopy?: boolean

Copy behavior:
- Business logic layer handles clipboard copy (expo-clipboard if added; otherwise via the controller)
- UI layer only calls the provided handler
- Expose success/failure state if useful, but keep it simple

Deliverables:
1. A presentational component file
2. A hook/controller file
3. A small types file if helpful
4. A usage example embedded beneath an AI coach / feedback text block
5. A short explanation of why the separation of concerns is correct

Implementation quality bar:
- Premium, calm, age-appropriate mobile feel
- Clean spacing and alignment using tokens
- No unnecessary abstractions, no dead code
- No placeholder business logic inside the UI component
- Keep naming generic enough for app-wide reuse
- Favor composition over prop bloat

Acceptance criteria:
- I can render the action bar under any coaching text content with minimal setup
- I can swap business behavior without editing the UI component
- The UI matches the screenshot closely in structure and feel
- The component is reusable, typed, accessible, and Expo-safe
- The code clearly separates presentation from interaction logic
- All styling comes from apps/mobile/src/design/tokens/, not raw values

Reuse existing patterns: if the repo already has shared pressable primitives, icon wrappers, or token helpers, use them instead of creating new ones. Follow the existing feature-based component conventions. Output the final code and a short usage example.
