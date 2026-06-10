# WriteWise Canvas Feature Prompt

Use this prompt when implementing, reviewing, or extending the WriteWise mobile
canvas feature.

WriteWise AI is a K-12 writing coach. Canvas work must help students plan,
handwrite, draw, annotate, and revise their own writing. Do not add flows that
complete assignments for students or turn canvas content into a polished final
answer without student work.

## Required Startup Context

Before making changes, read these files in order:

1. `AGENTS.md`
2. `docs/00_CONTEXT_BRIEF.md`
3. `prompts/01_master_agent_rules.md`
4. `.codex/EXECUTION_STATE.md`
5. `docs/07_CANVAS_ARCHITECTURE.md`
6. `docs/04_DATA_MODEL.md`
7. `services/api/docs/API_CONTRACT.md`

Also use the project skills when relevant:

- `skills/mobile-memory-guard/SKILL.md` for stroke data, autosave, previews,
  exports, offline storage, or sync queues.
- `skills/writing-screen-review/SKILL.md` for canvas screens and student work
  safety.
- `skills/expo-ota-vs-rebuild/SKILL.md` before adding orientation, native
  modules, app config, permissions, or dependencies.

## Current Project State

Primary app:

```txt
apps/mobile/
```

Canvas feature:

```txt
apps/mobile/src/features/canvas/
  api/canvasApi.ts
  components/
  hooks/useCanvas.ts
  screens/
    CanvasHomeScreen.tsx
    CanvasTemplatePickerScreen.tsx
    HandwritingCanvasScreen.tsx
    CanvasAttachmentScreen.tsx
  services/
    canvasDocumentService.ts
    canvasPersistenceService.ts
    canvasSyncService.ts
  stores/canvasToolStore.ts
  types.ts
```

Backend canvas scaffold:

```txt
services/api/src/features/canvas/canvas.contracts.ts
services/api/src/features/canvas/canvas.service.ts
services/api/docs/API_CONTRACT.md
services/api/docs/DATABASE_SCHEMA.md
```

Important reality check:

- The mobile canvas feature already exists.
- Canvas documents are compact stroke documents, not image buffers.
- Local persistence is implemented through
  `canvasPersistenceService.ts`.
- Sync orchestration is implemented through `canvasSyncService.ts`.
- Backend canvas code is framework-neutral scaffolding only. There is no running
  backend API server in this repository.
- Backend sync calls are gated behind
  `EXPO_PUBLIC_WRITEWISE_ENABLE_CANVAS_BACKEND_SYNC=true`.
- Do not document or code as if production canvas upload/export/recognition is
  fully deployed.

## Product And Safety Rules

The canvas supports student thinking:

- handwriting
- brainstorming
- planning
- annotation
- visual organization
- assignment attachments

Do not add disallowed AI or CTA language:

- Write my essay
- Finish for me
- Give me the answer
- Generate final draft
- Do my homework

Allowed coaching-oriented language:

- Give me a hint
- Help me brainstorm
- Check my sentence
- Explain this mistake
- Help me revise
- Suggest a stronger word
- Ask me a question

Canvas content can be used as context for coaching, feedback, or review only
through existing AI safety boundaries. Do not add a shortcut that converts a
canvas into a final answer.

## Architecture Rules

Keep Expo Router route files thin. Route files should import and export feature
screens only.

Keep canvas behavior inside the canvas feature unless it is truly shared:

- UI specific to canvas stays in `features/canvas/components`.
- Canvas state and hooks stay in `features/canvas/hooks` and
  `features/canvas/stores`.
- Canvas persistence, sync, and document logic stay in
  `features/canvas/services`.
- Shared reusable UI belongs in `apps/mobile/src/shared/components`.
- Shared contracts belong in `packages/shared` or existing service contracts
  only when there is a real cross-feature boundary.

Use existing shared UI primitives before creating new local UI:

- `Screen`, `Stack`, `Inline`, `PageSection`
- `Button`
- `Card`
- feedback states: `LoadingState`, `EmptyState`, `ErrorState`,
  `StatusState`, `SuccessState`, `OfflineBanner`
- `AppHeader`
- `Pill` for compact icon+label chips when appropriate

## Localization And Accessibility

Do not hardcode visible JSX copy. Add or reuse keys in:

```txt
apps/mobile/src/shared/i18n/en.ts
```

Every interactive control needs:

- accessible role when appropriate
- localized accessibility label
- minimum touch target
- non-color-only selected/error/sync states
- text that scales without clipping

Canvas toolbar controls must remain usable for elementary students and on older
school tablets.

## Grade Adaptation

Respect grade-band expectations:

- Grades 1-5: larger controls, simpler labels, fewer simultaneous choices.
- Grades 6-8: structured planning and paragraph support.
- Grades 9-12: mature layout, essay planning, annotation, and rubric-adjacent
  context.

Use existing grade adaptation helpers and design tokens instead of hardcoded
screen-specific sizing where possible.

## Canvas Data Model

Use the existing stroke-based model in:

```txt
apps/mobile/src/features/canvas/types.ts
```

Current constraints include:

```ts
MAX_CANVAS_STROKES = 240;
MAX_CANVAS_POINTS_PER_STROKE = 16;
MAX_CANVAS_DOCUMENTS = 24;
MAX_CANVAS_UNDO_STEPS = 12;
```

Current tool model:

```ts
type CanvasTool = "pen" | "eraser" | "highlighter";
```

Rules:

- Keep stroke data bounded.
- Keep undo/redo bounded.
- Validate data that crosses storage or API boundaries with Zod.
- Do not keep stroke arrays, serialized JSON, and preview images all retained in
  memory at the same time.
- Do not store base64 previews in React state or local JSON storage.
- Preview images, PDFs, object uploads, and handwriting recognition are future
  storage/export work unless explicitly requested.

## Save And Sync Behavior

Student work safety is the highest priority.

Required flow:

```txt
Student draws
  -> update local canvas state
  -> save local stroke document
  -> debounce sync work
  -> keep local document if backend fails
  -> surface sync_failed with retry
```

Use existing services:

- `canvasPersistenceService.ts` for local document persistence.
- `canvasSyncService.ts` for save, debounce, backend-placeholder, and attach
  orchestration.
- `canvasDocumentService.ts` for document creation, summaries, and attachment
  state.

Never block drawing on backend sync.
Never discard a local document because backend sync failed.
Always preserve a recovery path.

## Backend Boundary

Do not introduce a new backend framework unless the task explicitly asks for
production backend runtime work.

Use and extend the existing framework-neutral canvas contracts:

```txt
services/api/src/features/canvas/canvas.contracts.ts
services/api/src/features/canvas/canvas.service.ts
```

Current backend contracts cover:

- signed upload placeholders
- canvas metadata upsert shape
- assignment attach shape
- preview export queue shape
- recognition queue shape

If backend changes are required:

- update `services/api/docs/API_CONTRACT.md`
- update `services/api/docs/DATABASE_SCHEMA.md` if schema changes
- add migrations under `services/api/migrations/`
- keep RLS/authorization assumptions explicit
- do not put secrets, service-role keys, or provider credentials in mobile code
  or docs

## Orientation And Native Changes

Do not add screen orientation locking casually.

If a task explicitly requires landscape-only canvas behavior:

1. Check whether the needed native dependency already exists.
2. Use `skills/expo-ota-vs-rebuild/SKILL.md`.
3. Lock orientation only while the canvas screen is mounted.
4. Restore the previous/default orientation on unmount.
5. Document deployment impact. Adding `expo-screen-orientation`, permissions,
   config plugins, or app config changes requires a new native build.

Do not force landscape globally across the app.

## UX Direction

Canvas should feel like a focused writing surface, not a generic drawing app.

Prefer:

- clear lined paper and template guides
- calm toolbar
- visible save/sync state
- undo, redo, save, and attach actions
- compact controls that do not cover the writing area
- responsive phone/tablet layouts

Avoid:

- crowded toolbars
- childish worksheet styling
- dark mode as the default canvas experience
- decorative UI that reduces writing space
- hidden failure states

## Assignment Attachment

When a canvas document belongs to an assignment:

- preserve `assignmentId`
- allow attach only when a valid target assignment exists
- keep local attachment state if backend sync is disabled or fails
- return to the writing workspace with the attached canvas summary when the flow
  calls for it

Do not create a second attachment model that conflicts with
`canvasDocumentService.ts` or assignment/writing-workspace contracts.

## Testing Expectations

Add or update focused tests when changing:

- canvas document creation and summaries
- local persistence parsing
- autosave/sync scheduling
- backend placeholder parsing
- attachment behavior
- undo/redo behavior
- Zod validation
- toolbar state logic

Existing test areas:

```txt
apps/mobile/src/features/canvas/services/canvasDocumentService.test.ts
apps/mobile/src/features/canvas/services/canvasPersistenceService.test.ts
apps/mobile/src/features/canvas/services/canvasSyncService.test.ts
```

Run at minimum for implementation work:

```bash
./script/build_and_run.sh --typecheck
./script/build_and_run.sh --test
./script/build_and_run.sh --doctor
```

For docs-only prompt updates, run `git diff --check` at minimum.

## Documentation Discipline

If implementation changes canvas routes, data fields, API contracts, storage
behavior, sync behavior, backend contracts, or native orientation behavior, update
the canonical docs in the same change:

- `docs/07_CANVAS_ARCHITECTURE.md`
- `docs/04_DATA_MODEL.md`
- `docs/ARCHITECTURE_DECISIONS.md`
- `services/api/docs/API_CONTRACT.md`
- `services/api/docs/DATABASE_SCHEMA.md`

Do not describe fictional production state. State clearly when a capability is
local-only, scaffolded, placeholder-backed, or production-ready.

## Final Response Requirements

For implementation work, include:

- summary of changes
- files created or modified
- tests/checks run and results
- known limitations
- next recommended engineering step

When `mobile-memory-guard` is used, include a **Memory Impact** section.
When `writing-screen-review` is used, include a **Screen Review** section.
When native configuration or dependency changes are made, include a
**Deployment Impact** section.
