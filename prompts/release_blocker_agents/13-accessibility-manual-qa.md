# Agent Prompt: Accessibility Manual QA

Working directory: `/Users/malickdes/WorkSpace/writewise`

## Goal

Close `WW-REL-011`: automated accessibility/localization guards pass, but VoiceOver, TalkBack, large text, high contrast, reduced motion, and keyboard/switch workflows have not been manually verified.

## Required Startup

1. Read `AGENTS.md`.
2. Read `docs/00_CONTEXT_BRIEF.md`.
3. Read `prompts/01_master_agent_rules.md`.
4. Read `.codex/EXECUTION_STATE.md`.
5. Read `skills/ux-flow/SKILL.md`.
6. Read `skills/writing-screen-review/SKILL.md`.
7. Read this prompt.

## Scope

- Create and execute a practical accessibility QA matrix.
- Fix code-level accessibility issues discovered during manual/device QA.
- Keep all user-facing copy localized.

## Files To Inspect

- `docs/LOCALIZATION_ACCESSIBILITY.md`
- `docs/RELEASE_CHECKLIST.md`
- `apps/mobile/src/shared/components/**`
- `apps/mobile/src/shared/utils/accessibility.ts`
- `apps/mobile/src/features/profile-settings/accessibility/**`
- Core screens under `apps/mobile/src/features/**/screens`

## Required QA Matrix

- iOS VoiceOver.
- Android TalkBack.
- Large text/dynamic type.
- High contrast.
- Reduced motion.
- Keyboard/switch navigation where applicable.
- Small phone.
- Tablet.
- Grade bands: 1-2, 3-5, 6-8, 9-12.
- Student first assignment and canvas assignment.
- Parent report review.
- Teacher assignment creation.
- Paywall.

## Requirements

- Verify touch targets, focus order, roles, labels, hints, scaling, clipping, color-only signals, reduced motion, and error recovery.
- Fix actionable issues.
- Add regression tests for any reusable component fixes.
- Update release docs with real QA results and unresolved device limitations.

## Acceptance Criteria

- Manual QA checklist exists with device/platform results.
- Critical accessibility blockers are fixed.
- Remaining non-blocking issues are tracked with severity.
- Release checklist reflects completed/manual status honestly.

## Validation

- `./script/build_and_run.sh --typecheck`
- `cd apps/mobile && npm run lint -- --max-warnings=0`
- `./script/build_and_run.sh --test`
- Manual QA evidence documented in repo.

## Final Response

Include devices/simulators used, issues fixed, files changed, tests run, and remaining accessibility risks.
