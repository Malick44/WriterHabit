# WriterHabit AI — Agent Guide

WriterHabit AI is an AI-powered writing coach for students in Grades 1-12. It helps students think, plan, draft, revise, and improve their own writing across typed and handwriting/canvas workflows. It must never become a cheating or assignment-completion tool.

This file governs all coding and documentation work in `/Users/malickdes/WorkSpace/WriterHabit`. Read it before making changes, then keep it aligned with the real repository state.

## Required Startup Context

Before every implementation, review, debugging, documentation, or planning task, read these files in this order:

1. `AGENTS.md`
2. `docs/00_CONTEXT_BRIEF.md`
3. `prompts/01_master_agent_rules.md`
4. `.codex/EXECUTION_STATE.md`

After that, read the task-specific implementation prompt, screen prompt, project skill, and source files needed for the current work.

## Current Status

- Primary app: `apps/mobile/` (Expo SDK 56, React Native, Expo Router, TypeScript strict).
- Current implementation stage: feature scaffold, shared design-system foundation, role-based navigation foundation, localization/accessibility foundation, auth/session foundation, student onboarding flow, student home dashboard, assignment feature, typed writing workspace, canvas feature, policy-safe AI coach feature, feedback review/revision flow, local progress tracking/badges flow, daily assignment selection logic, notification-preparation and device-scheduling services, parent experience, teacher experience, local subscription/paywall entitlement flow, backend API contract/service-boundary scaffold, database schema/migration drafts, framework-neutral AI and notification backend services, canvas storage/sync, testing strategy foundation, security/privacy/academic-integrity/audit scaffolding, performance/offline/error-state polish, and final QA/release checklist docs exist.
- Prompt 02 audit/planning is complete.
- Prompt 04 design system/shared UI is complete.
- Prompt 05 navigation/role routing is complete.
- Prompt 06 localization/accessibility foundation is complete.
- Prompt 07 auth/session flow is complete.
- Prompt 08 student onboarding flow is complete.
- Prompt 09 student home dashboard is complete.
- Prompt 10 assignment feature is complete.
- Prompt 11 typed writing workspace is complete.
- Prompt 12 canvas feature is complete.
- Prompt 13 AI coach feature is complete.
- Prompt 14 AI review, feedback, and revision is complete.
- Prompt 15 progress tracking and badges is complete.
- Prompt 16 notifications and daily assignment logic is complete.
- Prompt 17 parent experience is complete.
- Prompt 18 teacher experience is complete.
- Prompt 19 subscription and paywall flow is complete.
- Prompt 20 backend API contract is complete.
- Prompt 21 database schema and migrations is complete.
- Prompt 22 AI backend services is complete.
- Prompt 23 canvas storage and sync is complete.
- Prompt 24 testing strategy implementation is complete.
- Prompt 25 security, privacy, and academic integrity is complete.
- Prompt 26 performance, offline support, autosave reliability, retry, and error-state polish is complete.
- Prompt 27 final QA and release checklist is complete.
- WW-REL-001 production backend runtime shell is implemented in `services/api/`.
- WW-REL-002 database migration/RLS verification is implemented and verified
  against the configured development Supabase through
  `node scripts/supabase-migrations.mjs apply-and-verify`.
- Next recommended engineering step: close remaining P0/P1 release blockers in
  `docs/KNOWN_ISSUES.md`, starting with resource-level API authorization,
  payment entitlement sync, mobile E2E automation, and backend lint/CI wiring.
- Git is initialized on branch `main`; implementation commits exist.
- Project-local Codex state is in `.codex/EXECUTION_STATE.md`.
- Codex actions are in `.codex/environments/environment.toml`.
- Supabase is connected for local development:
  - mobile app public client in `apps/mobile/src/core/supabase/supabaseClient.ts`
  - local admin CLI in `scripts/supabase-admin.mjs`
  - public app env in `apps/mobile/.env.local`
  - admin env in `.env.supabase-admin` (local only, never commit)

## Repository Layout

```txt
WriterHabit/
  apps/
    mobile/                         Expo React Native app
  packages/
    shared/                         Shared TypeScript contracts
  services/
    api/                            Backend API contract docs and framework-neutral feature stubs
  docs/                             Architecture, roadmap, API, AI, canvas, security docs
  prompts/                          Implementation prompts and specialist prompts
  prompts/WriterHabit_screen_design_prompts/
                                    Screen-by-screen design prompts
  skills/                           Project-specific agent skills
  templates/                        Prompt templates
  scripts/                          Utility/admin scripts
  script/                           Codex app run script
  .codex/                           Codex action and handoff indexes
```

Important current facts:

- `services/api/` now has a Fastify TypeScript runtime shell, package manifest, local build/test scripts, `/api/v1/health`, Supabase JWT verification, request IDs, standard API error middleware, authenticated session/profile smoke endpoints, fail-closed feature route shells, framework-neutral contract docs in `services/api/docs/`, migration files in `services/api/migrations/`, a controlled Supabase migration/RLS runner in `scripts/supabase-migrations.mjs`, feature boundary stubs in `services/api/src/features/`, and AI backend service scaffolding in `services/api/src/features/ai/`; no deployed API or production feature persistence exists yet.
- `packages/shared/src/index.ts` and `packages/shared/src/types.ts` exist and are imported through the mobile alias `@WriterHabit/shared`.
- No native `apps/mobile/ios/` or `apps/mobile/android/` folders should be kept unless the workflow intentionally changes from Expo CNG/prebuild.

## Mobile App Layout

```txt
apps/mobile/
  app/                              Expo Router route files only
  assets/                           app assets, including generated production candidates
  src/core/                         app-level config, auth, providers, API, Supabase
  src/features/                     product feature modules
  src/i18n/                         localization compatibility exports
  src/shared/i18n/                  canonical localization foundation
  src/services/                     device and cross-cutting service facades
  src/shared/                       shared UI, query, state, theme utilities
```

Current feature modules:

```txt
ai-coach
assignments
auth
canvas
feedback-review
onboarding
parent
profile-settings
progress
student-home
subscriptions
teacher
writing-workspace
```

Route rule:

- Files in `apps/mobile/app/` must stay thin.
- Route files should import and export feature screens.
- Do not put API calls, business logic, form state, or UI-heavy code in route files.

Feature rule:

- Each feature owns its `screens`, `components`, `hooks`, `api`, `services`, `stores`, `types`, constants, and tests when needed.
- Avoid giant global `screens/`, `components/`, `hooks/`, or `services` folders.
- Avoid direct imports of another feature's implementation details. Promote shared contracts to `apps/mobile/src/shared/` or `packages/shared/`.

Reusable UI rule:

- Before creating feature-local UI, always check the shared component layer in `apps/mobile/src/shared/components/` and reuse existing primitives when they fit.
- Use shared reusable systems for cross-screen patterns instead of duplicating UI logic in feature screens. Current examples include `Modal`, `BottomSheetModal`, `ModalProvider`, `useModal`, `TopAlertBanner`, `TopAlertProvider`, `useTopAlert`, `showTopAlert`, and `hideTopAlert`.
- If a new UI pattern is likely to appear in more than one feature or screen, build it as a typed shared component or shared provider system under `apps/mobile/src/shared/components/` first, then consume it from features.
- Feature-owned components should compose shared primitives and keep only feature-specific layout, state, and copy wiring locally.
- Shared UI components must stay localization-ready, accessibility-aware, theme-token based, and covered by focused tests when they include behavior.
- Do not introduce direct React Native `Modal`, ad hoc top banners/toasts, hardcoded alert UI, custom button variants, duplicate cards, or screen-local feedback patterns unless the shared component layer is insufficient. If it is insufficient, extend the shared component rather than forking the pattern.

## Stack And State

Mobile stack:

- Expo SDK 56
- React Native `0.85.3`
- Expo Router
- TypeScript strict
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Supabase JS
- Expo SecureStore
- Expo SQLite localStorage install for Supabase auth persistence and local JSON draft storage

State rules:

- Server state: TanStack Query.
- Local UI state: component state or Zustand.
- Persistent device state: storage facades under `apps/mobile/src/services/storage/`.
- Data crossing API, local storage, or AI boundaries should be validated with Zod.

Test runner:

- `apps/mobile/package.json` has `test: jest`.
- Jest uses `apps/mobile/jest.config.js` with the Expo preset.
- Feature-owned tests live under `apps/mobile/src/**/*.test.ts` and `apps/mobile/src/**/*.test.tsx`.
- Root acceptance tests live under `tests/unit/` and `tests/integration/`; E2E scenario docs live under `tests/e2e/`.

## Commands

Preferred project-root commands:

```bash
./script/build_and_run.sh --help
./script/build_and_run.sh              # Expo dev server for apps/mobile
./script/build_and_run.sh --ios
./script/build_and_run.sh --doctor
./script/build_and_run.sh --typecheck
./script/build_and_run.sh --test
node scripts/supabase-admin.mjs health
node scripts/supabase-migrations.mjs status
node scripts/supabase-migrations.mjs apply-and-verify
```

Mobile app commands from `apps/mobile/`:

```bash
npm start
npm run dev-client
npm run ios
npm run android
npm run typecheck
npx expo-doctor
```

Test command from `apps/mobile/`:

```bash
npm test
```

## Codex Project Setup

Project-local Codex files:

```txt
.codex/TASK_STARTUP.md
.codex/AUTONOMOUS_PROMPTS.md
.codex/EXECUTION_STATE.md
.codex/README.md
.codex/PROMPTS.md
.codex/SCREEN_DESIGN_PROMPTS.md
.codex/SKILLS.md
.codex/environments/environment.toml
script/build_and_run.sh
script/review_agent.sh
script/autonomous_prompt_runner.sh
```

Use `.codex/EXECUTION_STATE.md` as the handoff/memory file. It should remain concise and non-secret.

Autonomous and specialist review scripts run nested `codex exec` with full local filesystem access and approval prompts disabled for this trusted development workspace. Do not use those scripts on untrusted repositories, and keep secrets out of staged files and logs.

Codex actions currently include:

- `Run`
- `Run iOS`
- `Expo Doctor`
- `Typecheck`
- `Test`
- `Supabase Health`
- `Autonomous: Plan Prompts`
- `Autonomous: Continue Prompts`
- `Review: AI Safety`
- `Generate: Assets`
- `Review: Backend`
- `Review: Design`
- `Review: Frontend Polish`
- `Review: Product`
- `Review: Testing`
- `List Prompts`
- `List Specialist Agents`
- `List Screen Prompts`
- `List Skills`

Do not put secrets in `.codex/`.

Autonomous prompt runner:

- Use `./script/autonomous_prompt_runner.sh --dry-run` to preview the prompt sequence.
- Use `./script/autonomous_prompt_runner.sh --from auto --to 27` to run remaining prompts.
- The runner requires a clean Git worktree, runs validation after each prompt, and commits each prompt result.
- The runner does not push commits.
- The runner must never commit local env files, `node_modules/`, `.expo/`, or generated native folders.

## Prompt Workflow

Required context for all task work:

1. this `AGENTS.md`
2. `docs/00_CONTEXT_BRIEF.md`
3. `prompts/01_master_agent_rules.md`
4. `.codex/EXECUTION_STATE.md`

Prompt order is maintained in:

- `docs/00_PROMPT_ORDER.md`
- `docs/PROMPT_INDEX.json`
- `.codex/PROMPTS.md`

Current next prompt:

```txt
prompts/27_final_qa_release_checklist.md
```

Screen design prompt workflow:

- Use `.codex/SCREEN_DESIGN_PROMPTS.md` as the index.
- Before any screen-specific prompt, read:
  - `docs/00_CONTEXT_BRIEF.md`
  - `prompts/01_master_agent_rules.md`
  - `prompts/WriterHabit_screen_design_prompts/MASTER_SYSTEM_PROMPT.md`
  - `prompts/WriterHabit_screen_design_prompts/README.md`
  - `prompts/WriterHabit_screen_design_prompts/SCREEN_INVENTORY.md`
- Use one screen prompt at a time.

Asset generation workflow:

- Use `prompts/specialists/asset_generation_agent.md`.
- Plan assets in `docs/assets/ASSET_GENERATION_PLAN.md` before generating image files.
- Store generated app assets under `apps/mobile/assets/generated/`.
- Update `apps/mobile/assets/generated/README.md` whenever assets are added, replaced, or removed.
- Do not put generated assets in `apps/mobile/src/`.

## Project Skills

Project skills live in `skills/`. Read only the relevant `SKILL.md` before applying a skill, then load referenced files selectively.

Use:

- `skills/expo-ota-vs-rebuild/SKILL.md` for dependency, native module, app config, permission, Expo SDK, bundle id, or store-submission changes.
- `skills/mobile-memory-guard/SKILL.md` for large drafts, canvas data, long lists, AI payloads, autosave, offline storage, background sync, or memory-sensitive React Native work.
- `skills/supabase-postgres-best-practices/SKILL.md` for SQL, schema, indexes, RLS, query performance, and Supabase database work.
- `skills/ux-flow/SKILL.md` for multi-screen user flows, onboarding, dashboards, navigation, or IA planning.
- `skills/writing-screen-review/SKILL.md` for writing workspace, canvas, AI review, feedback, revision, or student assignment screens.

## Supabase Rules

Mobile client:

- Public client config is in `apps/mobile/src/core/config/supabaseConfig.ts`.
- Client instance is in `apps/mobile/src/core/supabase/supabaseClient.ts`.
- Mobile app may use only public Expo env vars:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - optional compatibility fallback `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Admin CLI:

- `scripts/supabase-admin.mjs` uses `.env.supabase-admin`.
- `.env.supabase-admin` is local-development only and ignored by git.
- The service-role key must never be placed in app code, `.codex`, docs, committed files, screenshots, or CI logs.

Self-hosted MCP:

- The public Supabase `/mcp` endpoint is intentionally blocked by Kong with `403`.
- Do not expose `/mcp` publicly.
- Current development access path is the HTTPS admin CLI through Postgres Meta, not MCP.

Useful local commands:

```bash
node scripts/supabase-admin.mjs health
node scripts/supabase-admin.mjs schemas
node scripts/supabase-admin.mjs tables public
node scripts/supabase-admin.mjs sql "select now()"
node scripts/supabase-admin.mjs auth-users
node scripts/supabase-admin.mjs buckets
node scripts/supabase-migrations.mjs status
node scripts/supabase-migrations.mjs apply-and-verify
```

## Product Safety Rules

WriterHabit AI is a learning app, not a cheating app.

Forbidden CTAs and flows:

- Write my essay
- Finish for me
- Give me the answer
- Generate final draft
- Do my homework
- Any action that silently replaces student thinking with an AI-completed submission

Approved CTAs and flows:

- Give me a hint
- Help me brainstorm
- Check my sentence
- Explain this mistake
- Help me revise
- Suggest a stronger word
- Ask me a question

AI output should be framed as coaching:

- one strength
- one improvement
- one next revision task
- age-appropriate wording
- no full polished rewrite of the assignment

## UX, Accessibility, And Grade Adaptation

Every feature should include loading, empty, error, and success states where applicable.

Every user-facing screen must be:

- accessibility-aware
- localization-ready
- safe for K-12 use
- clear about recovery paths for errors/offline/sync failures

Localization rule:

- Do not hardcode user-facing copy in React Native JSX, including `<Text>Hard coded text</Text>`, `Screen title="Hard coded text"`, button labels, placeholders, helper text, empty/error/success copy, or accessibility labels/hints.
- Add or reuse keys in `apps/mobile/src/shared/i18n/en.ts`, then render copy with `useI18n()`, `useT()`, or typed translation keys passed through feature view models.
- Service-generated user-facing labels, fallback display names, seeded form text, and mock content that appears on screen should also resolve through translation keys instead of inline English literals.
- Non-user-facing strings such as route names, test IDs, enum values, storage keys, API paths, CSS/font constants, and developer-only error names do not need translation keys.
- Run the localized JSX guard with the normal test suite after UI copy changes.

Grade bands:

- Grades 1-5: larger controls, simple wording, fewer visible metrics, friendly cues, handwriting/read-aloud support.
- Grades 6-8: structured learning cards, skill progress, paragraph and revision support.
- Grades 9-12: mature layout, essay planning tools, rubric detail, productivity-focused UI.

## Documentation Discipline

No documentation may describe a fictional state.

Rules:

- If code changes routes, data fields, tokens, API contracts, auth/session behavior, AI behavior, or storage behavior, update the relevant docs in the same change.
- Use real paths only.
- Do not duplicate core specs across docs. Extend the canonical doc instead.
- Current docs created by the audit:
  - `docs/IMPLEMENTATION_PLAN.md`
  - `docs/ARCHITECTURE_DECISIONS.md`
  - `docs/FEATURE_ROADMAP.md`
- Design-system documentation:
  - `docs/DESIGN_SYSTEM.md`
- Localization/accessibility documentation:
  - `docs/LOCALIZATION_ACCESSIBILITY.md`

Token documentation:

- The canonical token path is `apps/mobile/src/design/tokens/`.
- `apps/mobile/src/shared/theme/` is a compatibility export layer over the canonical token modules.
- New token work should update `apps/mobile/src/design/tokens/` and docs together.
- When documenting motion, use explicit token names such as `duration.sm`, `easing.standard`, `spring.cardPress`, and `spring.playerTransition`; do not use vague phrases like "fast fade" or "spring transition".

## Files And Areas To Avoid Unless Required

Do not touch casually:

- `apps/mobile/node_modules/`
- `apps/mobile/.expo/`
- `.env`
- `.env.*`
- `.DS_Store`
- generated native folders: `apps/mobile/ios/`, `apps/mobile/android/`
- service-role secrets
- `apps/mobile/package-lock.json` unless dependencies intentionally change
- prompt files unless the task is prompt maintenance

If generated native folders appear after `expo run:*` or `expo prebuild`, remove them unless the task explicitly changes the workflow to checked-in native projects.

## Done Criteria

For implementation work, finish with:

1. Summary of changes.
2. Files created or modified.
3. Tests/checks run and results.
4. Known limitations.
5. Next recommended prompt or next engineering step.

Minimum checks for mobile changes:

```bash
./script/build_and_run.sh --typecheck
./script/build_and_run.sh --doctor
./script/build_and_run.sh --test
```
