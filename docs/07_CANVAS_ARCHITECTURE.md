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

The adapter renders template guides and compact stroke dots in React Native. It
does not create base64 previews or hold exported image buffers in JS memory.
Preview images are a future file-system/object-storage feature.

## Autosave

Canvas must autosave locally first, then sync to backend.

Flow:

```txt
User draws stroke
  -> Update local canvas state
  -> Debounced local JSON autosave
  -> Surface sync status
  -> Future backend sync / preview export
```

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
- Attach the canvas document id to the assignment locally.
- Show attached canvas summary in the typed writing workspace.

Image export, object storage, and parent/teacher review previews remain future work.

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
