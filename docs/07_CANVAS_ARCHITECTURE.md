# 07 — Canvas Architecture

## Purpose

The canvas supports handwriting, drawing, brainstorming, annotation, and visual planning.

It is central to the product because students can work by hand, not only by typing.

## Canvas Modes

```ts
type CanvasTemplate =
  | "blank_page"
  | "lined_paper"
  | "storyboard"
  | "mind_map"
  | "essay_plan"
  | "vocabulary_web"
  | "handwriting_practice"
  | "annotate_passage";
```

## Feature Structure

```txt
features/canvas/
  screens/
    CanvasHomeScreen.tsx
    CanvasTemplatePickerScreen.tsx
    HandwritingCanvasScreen.tsx
    CanvasAttachmentScreen.tsx
  components/
    CanvasToolbar.tsx
    CanvasTemplateCard.tsx
    CanvasDocumentCard.tsx
    CanvasSyncStatusBadge.tsx
    StrokeCanvasAdapter.tsx
  hooks/
    useCanvas.ts
  services/
    canvasDocumentService.ts
    canvasPersistenceService.ts
    canvasSyncService.ts
  stores/
    canvasToolStore.ts
  types.ts
```

## Canvas Data

Current mobile implementation stores editable stroke data locally:

### Editable Stroke Data

Used to reopen and edit the canvas.

```ts
interface Stroke {
  id: string;
  tool: "pen" | "highlighter" | "eraser";
  color: string;
  width: number;
  points: Array<{ x: number; y: number; pressure?: number }>;
  createdAt: string;
}
```

The adapter captures continuous drawing with a `react-native-gesture-handler`
pan gesture (begin → sampled extend → end) and renders template guides plus
strokes as connected line segments between sampled points
(`CanvasStrokePath`). It does not create base64 previews or hold exported
image buffers in JS memory. Preview images are a future
file-system/object-storage feature.

Input sampling and bounds:

- Drag points are sampled at a minimum pixel distance in the adapter and a
  minimum normalized distance (`MIN_STROKE_POINT_DISTANCE`) in
  `canvasDocumentService.appendPointToCanvasStroke`.
- A stroke holds at most `MAX_CANVAS_POINTS_PER_STROKE` points; longer drags
  chain continuation strokes until `MAX_CANVAS_STROKES` is reached, then stop
  instead of dropping older work.
- One undo snapshot is recorded per gesture, not per sampled point, and the
  undo stack stays bounded by `MAX_CANVAS_UNDO_STEPS`.
- The eraser removes the nearest stroke only within `CANVAS_ERASE_DISTANCE`
  of the touch; erase gestures far from any stroke are no-ops.
- A single tap produces a one-point stroke rendered as a dot.

## Autosave

Canvas must autosave locally first, then sync to backend.

Flow:

```txt
User draws stroke
  -> Update local canvas state
  -> Debounced local JSON autosave through canvasSyncService
  -> Attempt backend metadata/upload/export placeholders when enabled
  -> Preserve local document and surface sync status if backend sync fails
```

Current implementation:

- `apps/mobile/src/features/canvas/services/canvasPersistenceService.ts`
  stores bounded editable stroke documents in local JSON storage.
- `apps/mobile/src/features/canvas/services/canvasSyncService.ts` saves
  locally first, debounces autosave scheduling, creates deterministic signed
  upload/export placeholders by default, and can call future backend endpoints
  only when `EXPO_PUBLIC_WriterHabit_ENABLE_CANVAS_BACKEND_SYNC=true`.
- Backend sync is scaffolded in
  `services/api/src/features/canvas/canvas.service.ts` and
  `services/api/src/features/canvas/canvas.contracts.ts`. There is still no
  running backend API server in this repository.

## Sync States

```ts
type CanvasSyncStatus =
  | "local_only"
  | "saving"
  | "saved"
  | "sync_failed";
```

## Canvas Toolbar

Required tools:

- Pen
- Eraser
- Highlighter
- Color picker
- Stroke size
- Undo
- Redo
- Save
- Attach to assignment

## Attachment Flow

```txt
Assignment Detail
  -> Start with Canvas
  -> Choose canvas template
  -> Draw/write on canvas
  -> Save canvas
  -> Attach to assignment
  -> Continue writing
  -> Submit assignment
```

## Handwriting Recognition

This should be optional for MVP.

MVP:

- Save canvas as image
- Attach image to assignment
- Allow parent/teacher review

Current app implementation:

- Save compact editable strokes locally.
- Attach the canvas document id to the assignment locally before sync.
- Show attached canvas summary in the typed writing workspace.
- Prepare signed upload and preview export placeholders for backend storage.

Actual image/PDF generation, object upload execution, and parent/teacher review
previews remain future work.

Post-MVP:

- Convert handwriting to text
- Extract outline from canvas
- Feed recognized text into AI review

## Performance Requirements

- Drawing should feel instant.
- Autosave should not block drawing.
- Canvas should work offline.
- Large canvas files should be compressed.
- Preview generation should happen in background.
