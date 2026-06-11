#!/usr/bin/env bash
# WriterHabit memory audit — scans for memory hotspots, leak risks, and
# retention smells specific to this Expo / React Native writing-assistant app.
set -euo pipefail

# Default ROOT to the repo root (four levels up: scripts -> skill -> skills -> repo)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="${1:-$(cd "$SCRIPT_DIR/../../.." && pwd)}"
REPORT_DIR="${2:-$ROOT/reports}"
REPORT_FILE="$REPORT_DIR/memory-audit.txt"

mkdir -p "$REPORT_DIR"

if command -v rg >/dev/null 2>&1; then
  SEARCH_BIN="rg"
  SEARCH_FLAGS=(
    --hidden
    --glob '!node_modules'
    --glob '!.git'
    --glob '!dist'
    --glob '!build'
    --glob '!android/**'
    --glob '!ios/**'
    --glob '!.expo/**'
    --glob '!docs/**'
    --glob '!skills/**'
    --glob '!reports/**'
    --glob '!*.md'
    --glob '!*.sql'
    --glob '!*.json'
    -n -S
  )
else
  SEARCH_BIN="grep"
  SEARCH_FLAGS=(
    -RIn
    --exclude-dir=node_modules
    --exclude-dir=.git
    --exclude-dir=dist
    --exclude-dir=build
    --exclude-dir=android
    --exclude-dir=ios
    --exclude-dir=.expo
    --exclude-dir=docs
    --exclude-dir=skills
    --exclude-dir=reports
    --include='*.ts'
    --include='*.tsx'
    --include='*.js'
  )
fi

run_search() {
  local label="$1"
  local pattern="$2"

  {
    echo
    echo "================================================================================"
    echo "$label"
    echo "Pattern: $pattern"
    echo "================================================================================"
  } >> "$REPORT_FILE"

  if [ "$SEARCH_BIN" = "rg" ]; then
    rg "${SEARCH_FLAGS[@]}" "$pattern" "$ROOT" >> "$REPORT_FILE" 2>/dev/null || true
  else
    grep "${SEARCH_FLAGS[@]}" -E "$pattern" "$ROOT" >> "$REPORT_FILE" 2>/dev/null || true
  fi
}

count_search() {
  local pattern="$1"
  if [ "$SEARCH_BIN" = "rg" ]; then
    rg "${SEARCH_FLAGS[@]}" "$pattern" "$ROOT" 2>/dev/null | wc -l | tr -d ' ' || echo 0
  else
    grep "${SEARCH_FLAGS[@]}" -E "$pattern" "$ROOT" 2>/dev/null | wc -l | tr -d ' ' || echo 0
  fi
}

cat > "$REPORT_FILE" <<EOF
WriterHabit Memory Audit
Generated: $(date)
Root: $ROOT

This is a heuristic static scan — not proof of a bug.
Review findings manually before changing code.

Scope: apps/mobile/src features (writing-workspace, canvas, ai-coach,
       feedback-review, assignments, progress, teacher), shared, core.
Excluded: node_modules android ios .expo docs skills reports

Legend:
  HIGH   — often worth checking first
  MEDIUM — pattern may be valid, but can hide memory pressure
  WW     — WriterHabit-specific hotspot

EOF

# ── HIGH-SIGNAL checks ──────────────────────────────────────────────────────

run_search "HIGH: Zustand store / state shape (large payloads in stores)" \
'create\(|useStore|canvasToolStore|useCanvasTools|useWritingWorkspace|useAiCoach|useOnboarding'

run_search "HIGH: base64 usage (canvas previews, exported images)" \
'base64|toDataURL|readAsStringAsync|readAsDataURL|Buffer\.from\(.*base64|data:image'

run_search "HIGH: JSON stringify / parse churn (drafts, stroke docs)" \
'JSON\.stringify\(|JSON\.parse\('

run_search "HIGH: large text / draft retention in state" \
'draftText|fullText|rawText|studentText|canvasText|revisionText|essayText|submissionText|content'

run_search "HIGH: canvas stroke data accumulation" \
'strokes|stroke\b|points\b|addStroke|appendStroke|strokeHistory|undoStack|redoStack|canvasDocument|serializeCanvas'

run_search "HIGH: autosave pipeline (debounce / snapshot churn)" \
'autosave|autoSave|useCanvasAutosave|debounce|saveDraft|persistDraft|snapshot|flushSave'

run_search "HIGH: unbounded arrays or accumulate patterns" \
'\.push\(|concat\(|\[\s*\.\.\.|Array\.from\(|accumulate|appendTo|enqueue'

run_search "HIGH: cache / storage (AsyncStorage, SecureStore, query cache)" \
'AsyncStorage|asyncStorage|SecureStore|secureStore|persist|TTL|gcTime|staleTime|evict|maxEntries|maxSize|cacheKey|cached|lru|memoize'

run_search "HIGH: listener / subscription / timer leaks" \
'addEventListener|removeEventListener|subscribe\(|unsubscribe|addListener|removeListener|setInterval\(|clearInterval\(|setTimeout\(|clearTimeout\(|AppState\.add|Keyboard\.add|BackHandler\.add'

run_search "HIGH: image retention (canvas previews, attachments, review images)" \
'Image\.prefetch|preloadImages|previewImageUrl|previewImage|thumbnailUrl|imageUrl|attachmentUrl|canvasPreview'

run_search "HIGH: list rendering risks (FlatList, FlashList, ScrollView)" \
'<FlatList|<FlashList|<SectionList|<ScrollView'

# ── MEDIUM-SIGNAL checks ────────────────────────────────────────────────────

run_search "MEDIUM: duplicate in-memory representation (raw + processed)" \
'rawDraft.*parsed|source.*derived|original.*processed|response.*mapped|text.*tokens|content.*processed|strokes.*serialized'

run_search "MEDIUM: useEffect / useFocusEffect (cleanup audit)" \
'useEffect\(|useFocusEffect\('

run_search "MEDIUM: useRef holding long-lived or heavy objects" \
'useRef\('

run_search "MEDIUM: TanStack Query hotspots (cache retention, large results)" \
'useQuery|useMutation|useInfiniteQuery|queryClient|invalidateQueries|setQueryData|fetch\('

run_search "MEDIUM: AI coach / review payload handling" \
'aiCoach|aiReview|AiCoachContext|AiCoachResponse|reviewPrompt|feedbackSummary|rubric|coachMessage|aicoachApi|feedbackreviewApi'

run_search "MEDIUM: navigation screen state retention" \
'useNavigation|useRouter|navigation\.navigate|router\.push|useFocusEffect|screenOptions|unmountOnBlur'

run_search "MEDIUM: repeated transforms in render paths" \
'return .*\.map\(|\.map\(.*=>.*<|render.*\.map\(|<FlatList.*renderItem|<FlashList.*renderItem'

run_search "MEDIUM: handwriting recognition / image-to-text (large intermediates)" \
'handwritingRecognition|recognizeText|convertToText|extractTextFrom|imageToText|ocr'

# ── WriterHabit-SPECIFIC checks ───────────────────────────────────────────────

run_search "WW: Canvas undo/redo history — ensure it is bounded" \
'undoStack|redoStack|undoHistory|history\.push|maxUndo|undoLimit|snapshotStack'

run_search "WW: Canvas sync state machine — failed-sync retention" \
'CanvasSyncStatus|local_only|sync_failed|syncStatus|canvasPersistenceService|canvasExportService|uploadPreview'

run_search "WW: Long draft / revision text in workspace" \
'WritingWorkspace|OutlineBuilder|RevisionScreen|writingworkspaceApi|outline|revisionTask'

run_search "WW: Assignment / progress / submission list growth" \
'AssignmentHistory|assignmentsApi|progressApi|teacherApi|submissions|history\b|loadMore|loadNextPage|pagination'

run_search "WW: Session / draft state cleared on sign-out / account switch" \
'signOut|clearUser|resetStore|clearSession|clearDraft|onboardingStore|useAuth'

# ── HEURISTIC SUMMARIES ──────────────────────────────────────────────────────
STATE_COUNT=$(count_search 'useState\(|useReducer\(|create\(|useStore')
BASE64_COUNT=$(count_search 'base64|toDataURL|readAsStringAsync|readAsDataURL|data:image')
JSON_COUNT=$(count_search 'JSON\.stringify\(|JSON\.parse\(')
LISTENER_COUNT=$(count_search 'addEventListener|addListener|subscribe\(|setInterval\(|setTimeout\(')
LIST_COUNT=$(count_search '<FlatList|<FlashList|<SectionList|<ScrollView')
CACHE_COUNT=$(count_search 'AsyncStorage|SecureStore|persist|cache|gcTime|staleTime|TTL')
DRAFT_COUNT=$(count_search 'draftText|studentText|canvasText|revisionText|fullText|rawText')
STROKE_COUNT=$(count_search 'strokes|undoStack|redoStack|canvasDocument|serializeCanvas|autosave')
AI_COUNT=$(count_search 'aiCoach|aiReview|AiCoachContext|AiCoachResponse|rubric|feedbackSummary')

cat >> "$REPORT_FILE" <<EOF

================================================================================
SUMMARY COUNTS
================================================================================
Store/state matches:        $STATE_COUNT
Base64 matches:             $BASE64_COUNT
JSON churn matches:         $JSON_COUNT
Listener/timer matches:     $LISTENER_COUNT
List component matches:     $LIST_COUNT
Cache/storage matches:      $CACHE_COUNT
Draft/text matches:         $DRAFT_COUNT
Canvas/stroke matches:      $STROKE_COUNT
AI coach/review matches:    $AI_COUNT

================================================================================
MANUAL REVIEW CHECKLIST (WriterHabit)
================================================================================
1. Store / workspace state shape
   - Are full drafts, stroke documents, base64 previews, or large server payloads
     (rubrics, reports, feedback) held in store slices or component state?
   - Can they be referenced by ID, normalized, or kept in local storage instead?

2. Canvas stroke + autosave pipeline
   - Does autosave copy/serialize the entire stroke document on every stroke?
   - Are strokes appended incrementally and the snapshot debounced?
   - Is the undo/redo stack bounded (max steps), or does it grow per stroke?

3. Canvas sync lifecycle
   - On sync_failed, is the local copy preserved and retried (never discarded)?
   - Are preview images generated in the background and source buffers released?

4. Draft safety vs memory
   - Are typed drafts persisted to local storage on a debounce (not just on Save)?
   - Is the same draft duplicated across query cache + Zustand + local storage?

5. AI coach / review payloads
   - Are full AiCoachContext / feedback responses retained after use?
   - Is cached feedback bounded (TTL / max entries), or unbounded by submission id?

6. Listener / subscription / autosave cleanup
   - Does every useEffect attaching a listener return a cleanup?
   - Are in-flight autosave/sync calls cancelled on unmount?

7. List efficiency
   - Are assignment-history, progress, and teacher-submission lists virtualized?
   - Is any large collection rendered inside a plain ScrollView?

8. Cache bounds
   - Do AsyncStorage/SecureStore caches have a pruning/retention policy?
   - Are TanStack Query gcTime/staleTime set so results aren't retained forever?

9. Sign-out / session reset
   - Is all user-scoped store and draft state cleared on sign-out / account switch?

10. OTA vs rebuild
    - Any fix touching native modules (canvas native renderer, file export,
      secure storage plugin, notifications) requires a rebuild — see the
      expo-ota-vs-rebuild skill.

================================================================================
TOP PRIORITY REVIEW TARGETS
================================================================================
- apps/mobile/src/features/writing-workspace
- apps/mobile/src/features/canvas
- apps/mobile/src/features/feedback-review
- apps/mobile/src/features/ai-coach
- apps/mobile/src/features/assignments
- apps/mobile/src/features/progress
- apps/mobile/src/features/teacher
- any screens using FlatList / ScrollView with large content
- any code handling drafts, canvas strokes, autosave, or AI feedback payloads

================================================================================
Done. Report: $REPORT_FILE
================================================================================

EOF

echo "Memory audit written to: $REPORT_FILE"
