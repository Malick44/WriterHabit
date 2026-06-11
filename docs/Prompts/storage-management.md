You are working in the WriterHabit Expo / React Native app. Implement a complete Storage & Data Management Center that reflects the current codebase reality and the app's child-privacy obligations.

Date of audit baseline: June 8, 2026.

Context and current state
- WriterHabit is a Grades 1–12 student writing assistant. Read docs/10_SECURITY_PRIVACY.md before coding: this app serves children, so data export and deletion are core product requirements, not nice-to-haves. Parents can request data deletion; inactive drafts should be deleted after a retention period; keep audit logs without storing full student text where possible.
- There is no storage/data-management UI yet. Settings live in the profile-settings feature:
  - apps/mobile/src/features/profile-settings/screens/AppSettingsScreen.tsx
  - apps/mobile/src/features/profile-settings/screens/AccessibilitySettingsScreen.tsx
  - apps/mobile/src/features/profile-settings/screens/StudentProfileScreen.tsx
  - apps/mobile/src/features/profile-settings/api/profilesettingsApi.ts
- Persistent local state includes unsaved drafts, offline canvas documents, accessibility preferences, and Supabase auth persistence through the mobile public client (`apps/mobile/src/core/supabase/supabaseClient.ts`). There is no MMKV in this project.
- The canvas feature writes the heaviest local data: editable stroke documents and preview images, with a local-first autosave + backend sync state machine (local_only → saving → saved → sync_failed). See docs/07_CANVAS_ARCHITECTURE.md and:
  - apps/mobile/src/features/canvas/services/canvasApi.ts (and canvasPersistenceService / canvasExportService per the canvas doc)
  - apps/mobile/src/features/canvas/stores/canvasToolStore.ts
- Planned backend app data calls use apps/mobile/src/core/api/apiClient.ts. Current mobile auth/session uses the public Supabase client in apps/mobile/src/core/supabase/supabaseClient.ts; do not introduce service-role keys or admin credentials into mobile code, docs, screenshots, or .codex files. Cloud-synced canvas files/exports remain planned for object storage through signed URLs unless the backend contract changes.
- Mobile tests use Jest (apps/mobile/package.json "test": "jest") but feature test coverage is minimal.

Goal
Build a production-ready Storage & Data Management Center, reachable from profile-settings, where a student (and, where required, a parent/guardian) can:
1) See real local/cloud usage by category.
2) Delete by category or item safely.
3) Sync eligible local files (canvas documents, exports) to cloud, then free local storage.
4) Export and delete their own data to satisfy the privacy requirements in docs/10.
5) Preserve privacy controls, offline behavior, and draft/canvas safety.

Hard requirements
- OTA-safe only. No native dependency/plugin additions (see skills/expo-ota-vs-rebuild/SKILL.md).
- Memory-safe patterns only (see skills/mobile-memory-guard/SKILL.md): no large base64 buffering, paged/chunked inventory, bounded queues/caches, no full stroke-document duplication.
- Reuse existing architecture: feature-based folders, route files re-export feature screens, TanStack Query for server/inventory state, Zustand for local UI state.
- TypeScript strict; no any.
- Use the project's localization approach in `apps/mobile/src/shared/i18n/`; no raw user-facing strings in JSX.
- Use tokenized styling from apps/mobile/src/design/tokens/ (colors, spacing, radius). No raw hex/spacing.
- Deletion must be idempotent and failure-safe. Never lose unsynced student work.
- Respect role-based access (docs/10): a student manages their own data; parent-initiated deletion follows the parent controls flow.

Primary integration points (real paths / conventions)
- New feature (or profile-settings sub-area):
  - apps/mobile/src/features/storage/screens/StorageManagementScreen.tsx
  - apps/mobile/src/features/storage/screens/DataPrivacyScreen.tsx (export/delete-my-data)
  - apps/mobile/src/features/storage/index.ts, types.ts
  - Route files under apps/mobile/app/ that re-export these screens.
- Entry point: add a "Storage & Data" row in profile-settings (AppSettingsScreen.tsx) that navigates to the new screens.
- Compose with existing storage/persistence:
  - AsyncStorage / SecureStore wrappers (create shared/services/storage wrappers if not present)
  - canvas persistence/export services (canvas stroke docs + preview images)
  - core/api/apiClient.ts for cloud object-storage operations via the backend
- Cloud boundary: apps/mobile/src/core/api/apiClient.ts (signed-URL upload/download/delete through the API).

Deliverables

A) Unified storage inventory service
- Add apps/mobile/src/features/storage/services/storageInventoryService.ts with a normalized model:
  - categoryId: 'drafts' | 'canvas-documents' | 'canvas-previews' | 'canvas-exports' | 'ai-feedback-cache' | 'secure-store' | 'preferences' | 'cloud-assets'
  - localBytes, cloudBytes (nullable), itemCount, deletable, syncable, lastUpdated
  - optional paged child items (id, name, sizeBytes, updatedAt, location: 'local' | 'cloud' | 'both', syncStatus where relevant)
- Gather from:
  - canvas local draft storage (stroke documents) and generated preview/export files
  - typed-draft local storage keys
  - cached AI feedback (bounded TanStack Query / local cache)
  - known AsyncStorage keys and SecureStore namespaces
  - cloud references inferable from synced-canvas/submission metadata via the API
- Keep scans incremental/paged for large sets; never read whole files into memory to size them.

B) Storage management UI
- StorageManagementScreen shows live inventory category cards with bytes/counts and expandable item lists.
- Multi-select actions:
  - Delete local only
  - Delete cloud only (when cloud-backed)
  - Delete both
  - Sync to cloud and free local
- Safeguards:
  - confirmation modal with exact byte/count impact
  - protect canvas documents whose syncStatus is local_only or sync_failed (do not allow "free local" until verified synced)
  - protect the active/open draft and canvas
  - partial-success and per-item failure reporting

C) Sync-then-free-space orchestration
- Add apps/mobile/src/features/storage/services/storageSyncOrchestrator.ts:
  - verify auth and that privacy/parent settings allow cloud sync
  - upload canvas documents/exports from file URI via signed URL (no large in-memory conversion, reuse canvasExportService patterns)
  - persist cloud pointer metadata per item; mark cloudBacked only after verified upload
  - delete the local copy only after cloud verification succeeds
- Persist queue state and bounded retry count; resume on foreground/network regain using existing app lifecycle boundaries.

D) Centralized delete APIs
- Add apps/mobile/src/features/storage/services/storageDeleteService.ts with idempotent operations:
  - deleteItem
  - deleteCategory
  - clearLocalData (preserve auth/session unless explicitly requested)
  - factoryReset (explicitly includes auth/session reset)
- Keep inventory/metadata maps consistent after every delete.

E) Data export & privacy (docs/10 requirements)
- DataPrivacyScreen supports:
  - Export my data (request a student-data export through the API; download/share the result)
  - Delete my data (student-initiated where allowed; otherwise route to the parent-controlled deletion flow)
- Cloud actions respect per-user path conventions and server-side authorization (the backend enforces access; the client must not assume it can reach another user's objects).
- Deleting cloud/both removes the storage object and the local metadata pointer consistently; fail safely with user-readable localized error copy.

F) Telemetry (safe metadata only — never log student text, per docs/10)
- Emit: storage_viewed, storage_deleted, storage_synced, storage_sync_failed, data_export_requested, data_deletion_requested.

G) Testing and verification
- Add Jest tests for inventory aggregation and transactional sync/delete behavior (pure, unit-testable services).
- Always run typecheck (tsc --noEmit) and lint (eslint .) in apps/mobile.
- Do not mock academic-integrity/privacy rule checks in tests (per docs/09_TESTING_STRATEGY.md).

Acceptance criteria
- User sees real total local usage and category breakdown in one screen.
- User can inspect and remove individual stored items.
- User can sync eligible local canvas files to cloud and free local space.
- No local deletion occurs when upload verification fails, and no unsynced (local_only/sync_failed) canvas work is ever silently dropped.
- User can export and request deletion of their data per the privacy requirements.
- Operations remain bounded in memory (paged inventory, bounded retries, no unbounded arrays, no full-document copies).
- Existing offline draft/canvas flows and settings remain functional.

Post-implementation improvement requirements (v1.1+)
- Treat first release as baseline; schedule hardening immediately after rollout.
- Require automated checks for: inventory aggregation correctness; delete idempotency and partial-failure behavior; sync retry/resume; "no local delete when upload verification fails."
- Add telemetry review gates for the events above (including export/deletion requests).
- Define quality thresholds and follow-ups when: sync failure rate exceeds baseline; average storage action latency regresses; partial-success events spike.
- Add periodic cloud/local reconciliation to detect and repair dangling metadata pointers.
- Add performance budget checks for large inventories (paging, chunking, memory bounds).
- Add UX hardening for recovery states: clear partial-success messaging; retry from failed rows; background resume visibility after foreground/network restore.
- Re-validate privacy, role-based access, and retention behavior after each storage flow expansion.

Implementation notes
- Prefer small, composable services over monolithic rewrites.
- Keep screen components thin; place orchestration in services/hooks.
- Reuse existing components, navigation, and token patterns.
- Keep all new UI copy in localization keys, never hardcoded in JSX.
