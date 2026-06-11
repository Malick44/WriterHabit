---
name: mobile-memory-guard
description: Review and guide WriterHabit Expo/React Native work for memory efficiency and retention safety. Use when tasks involve long assignment/progress lists, large typed drafts, canvas stroke data, image previews/exports, AI feedback payloads, autosave, offline canvas storage, background sync, or repeated rerenders. Do not use for pure visual polish with no data, canvas, or lifecycle impact. Output should identify memory hotspots, leak risks, bounded-cache decisions, and concrete fixes.
---

# Mobile Memory Guard

This skill exists to make memory efficiency a hard engineering constraint in WriterHabit's
Expo / React Native app. WriterHabit runs on student devices — including older, low-memory
Android tablets in classrooms — and holds work that must not be lost: typed drafts,
handwriting strokes, and AI feedback. Memory pressure here corrupts or drops a child's
work.

Use this skill when:
- implementing or reviewing screens that render long lists (assignment history, progress,
  badges, teacher submission lists)
- working with large typed drafts, revision text, or accumulated student writing
- handling canvas stroke data, autosave buffers, preview images, or canvas exports
- handling AI coach/review payloads (request context + feedback responses) that may be large
- introducing caches, offline canvas/draft storage, background sync, subscriptions, or polling
- processing API responses that may be large or repeated (rubrics, reports, feedback)
- reviewing code for leaks, retention, duplicate in-memory payloads, or unnecessary rerenders

Do not use this skill when:
- the task is only copy updates, spacing, colors, or visual polish
- the change is trivial and has no state, lifecycle, canvas, list, or storage impact
- another skill is more specific and already covers the risk area better

## Primary goals

1. Minimize retained memory.
2. Avoid duplicate large payloads (raw draft + transformed draft, strokes + serialized strokes + preview).
3. Prefer bounded, incremental processing over full in-memory materialization.
4. Prevent retention leaks from listeners, timers, autosave debouncers, subscriptions, and long-lived references.
5. Keep React state minimal, stable, and scoped.

## Review checklist

For every relevant task, inspect these areas:

### 1) Data loading and transformation
- Do not load full assignment/progress history if pagination or windowing is possible.
- Avoid building large intermediate arrays unless necessary.
- Avoid repeated `map/filter/reduce` chains over large collections when one pass is enough.
- Avoid copying large objects/arrays (stroke lists, drafts) just to make minor changes.
- Avoid repeated `JSON.stringify` / `JSON.parse` cycles on large drafts or stroke documents.
- Prefer normalized or compact representations when repeated access is needed.

### 2) React state shape
- Do not store large drafts, full stroke documents, base64 preview images, or duplicate
  server responses (rubrics, reports, feedback) in component state unless strictly necessary.
- Keep state to the minimum needed for rendering and interaction.
- Derive transient values (word counts, validation) instead of persisting every computed result.
- Use refs or the Zustand `canvasToolStore` for non-visual mutable values rather than React state.
- Be suspicious of "one giant workspace/canvas state object".

### 3) Lists and rendering
- Lists with meaningful length (assignment history, progress, badges, teacher submissions)
  should be virtualized.
- Avoid rendering offscreen items unnecessarily.
- Use stable keys.
- Prevent parent rerenders (e.g. an autosave tick) from cascading through large lists or the canvas.
- Memoize row components or selectors where it materially reduces churn.
- Watch for inline closures and unstable props in hot paths (canvas toolbar, list rows).

### 4) Canvas and document flows
- Do not keep full stroke arrays, serialized stroke JSON, and the rendered preview image
  alive at the same time longer than needed.
- Autosave must not duplicate the entire stroke document on every stroke — append/diff, debounce.
- Generate preview images in the background and release source buffers afterward.
- Avoid base64 for canvas previews/exports unless there is no better option; prefer file URIs.
- Keep undo/redo history bounded (max steps), not an unbounded snapshot stack.
- Release temporary parsing/recognition artifacts (handwriting-to-text) once normalized.

### 5) Caching and offline storage
- Every cache must define a bound: max entries, byte budget, TTL, or explicit eviction.
- Never introduce an unbounded cache (e.g. cached AI feedback keyed by submission with no limit).
- TanStack Query: set sane `gcTime`/`staleTime`; don't retain every report/feedback result forever.
- Offline drafts and canvas docs in AsyncStorage/SecureStore must have a pruning/retention policy.
- Avoid caching the same content in multiple layers (query cache + Zustand + local storage)
  without a clear reason.

### 6) Lifecycles and leaks
- Clean up listeners, subscriptions, intervals, timeouts, autosave debouncers, and animation handles.
- Ensure effect cleanup is complete and correct (cancel in-flight autosave/sync on unmount).
- Watch for retained closures that keep large drafts or stroke arrays alive.
- Be careful with global singletons / stores that accumulate references across mounts.
- Ensure background sync tasks and event emitters do not double-register across mounts.

### 7) Expo / React Native specifics
- Be careful with memory pressure from:
  - long FlatLists / FlashLists (history, progress, teacher submissions)
  - canvas screens with many strokes or large preview images
  - image-heavy review screens (canvas attachments, parent/teacher review)
  - offline sync queues
  - navigation stacks retaining heavy workspace/canvas state when backgrounded
- Flag whether the change is OTA-safe, dev-build only, or rebuild-required
  (see the `expo-ota-vs-rebuild` skill) when it touches native modules, plugins, or app config.

## Preferred implementation patterns

Prefer:
- pagination/windowing over full history fetches
- diff/append autosave over full stroke-document copies
- normalized data over repeated transformed copies
- refs / Zustand store for non-visual mutable canvas/tool values
- memoized selectors in hot paths
- virtualization for large collections
- bounded undo/redo and bounded caches (size or TTL)
- background preview generation with source release
- explicit cleanup (cancel autosave/sync) in every long-lived effect

Avoid:
- giant unbounded arrays in memory (stroke history, accumulated drafts)
- storing raw draft + transformed draft + preview simultaneously
- base64 storage for large previews/exports unless justified
- uncontrolled retries or sync queues that accumulate indefinitely
- accidental double subscription / double autosave registration
- keeping hidden workspace/canvas screens alive with large retained state unless needed

## Required output format

When this skill is used, produce a **Memory Impact** section with:

1. **Hotspots considered** — largest likely allocations or retained structures (drafts, strokes, previews, lists, feedback payloads)
2. **Leak risks checked** — listeners, timers, autosave debouncers, subscriptions, closures, caches, navigation retention
3. **Decisions made** — pagination, diff-autosave, virtualization, cache bounds, undo limits, state minimization
4. **Concrete fixes** — specific changes made or recommended
5. **Remaining tradeoffs** — what is still memory-expensive and why it is acceptable or what to improve later
6. **OTA vs rebuild** — whether any choice affects deployment mode

## Task procedure

For implementation tasks:
1. Identify likely memory hotspots before writing code.
2. Choose the smallest-retention design that still protects the student's work.
3. Implement with bounded structures, diff-based autosave, and explicit cleanup.
4. Review the diff for unnecessary copies, retained payloads, and render churn.
5. End with the required Memory Impact section.

For review tasks:
1. Scan for large payload handling (drafts, strokes, feedback, reports).
2. Scan for unbounded caches, sync queues, or undo stacks.
3. Scan for cleanup omissions (autosave/sync not cancelled).
4. Scan for list/canvas rendering inefficiencies.
5. Report concrete fixes, not generic advice.

You can run `scripts/check-memory.sh` for a heuristic static scan of WriterHabit-specific
hotspots before reviewing manually.

## Trigger phrases and examples

Likely use this skill when the user asks for things like:
- "optimize the writing workspace"
- "review the canvas for memory leaks"
- "make autosave memory efficient"
- "handle very long drafts"
- "improve assignment history list performance"
- "cache AI feedback offline"
- "review whether the canvas is safe on low-memory tablets"

Do not trigger just because the word "performance" appears if the task is only about
animation polish or styling.

## Example mini-findings

Bad:
- Storing the raw draft, a transformed/validated copy, and the word-count derivation in
  state at the same time.

Better:
- Store the draft once and derive validation/word-count on the fly.

Bad:
- Autosave serializes and keeps a full copy of the entire stroke document on every stroke.

Better:
- Append strokes incrementally and debounce a single serialized snapshot.

Bad:
- Unbounded in-memory cache of AI feedback keyed by submission id with no TTL or max size.

Better:
- Bounded cache (fixed entry limit / TTL) plus TanStack Query `gcTime`.

Bad:
- Canvas undo stack retains a full-document snapshot per step, unbounded.

Better:
- Bounded undo history (max N steps) using stroke diffs.

## Success criteria

This skill is successful when:
- memory risks are identified early
- the implementation avoids obvious duplication and retention of drafts/strokes/feedback
- caches, sync queues, and undo stacks are bounded
- autosave/sync cleanup is explicit
- the student's work is never at risk from memory pressure
- the final response includes a concrete Memory Impact section
