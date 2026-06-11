# Release Blocker Agent Prompts

Generated: 2026-06-11

These prompts break the remaining production-release issues into agent-sized implementation tasks. They are based on `docs/KNOWN_ISSUES.md`, `docs/APP_IMPLEMENTATION_AUDIT.md`, and `docs/RELEASE_CHECKLIST.md`.

Run one prompt per agent/worktree where possible. Start with the P0 security and data-truth prompts before payment, AI, notifications, or store operations.

Automation is available through `script/release_blocker_agent_runner.sh`. The runner executes each prompt, runs checks, sends the result to a review agent, and loops until the review report ends with `REVIEW_STATUS: approved` or the task is blocked/max rounds are reached. See `.codex/RELEASE_BLOCKER_AUTOMATION.md`.

## Prompt Order

1. `01-production-backend-runtime.md` - `WW-REL-001`, audit `P0-1`
2. `02-server-derived-roles-authz.md` - audit `P0-2`, release profile/auth gaps
3. `03-rls-migration-runner-tests.md` - `WW-REL-002`, audit `P0-4`
4. `04-server-side-workflow-state-machines.md` - audit `P0-5`
5. `05-payments-entitlements.md` - `WW-REL-003`, audit `P0-8`
6. `06-parent-teacher-production-data.md` - audit `P0-9`, part of `WW-REL-010`
7. `07-audit-retention-export-deletion.md` - audit `P0-10`
8. `08-mobile-e2e-automation.md` - `WW-REL-004`, audit `P1-4`
9. `09-ai-runtime-provider-safety.md` - `WW-REL-007`, part of audit `P1-9`
10. `10-canvas-storage-export-sync.md` - `WW-REL-008`, part of audit `P1-9`
11. `11-production-notifications.md` - `WW-REL-009`, audit `P1-14`
12. `12-auth-profiles-onboarding-sync.md` - `WW-REL-010`
13. `13-accessibility-manual-qa.md` - `WW-REL-011`
14. `14-release-operations-eas-store-observability.md` - `WW-REL-012`
15. `15-web-support-release-surface.md` - `WW-REL-006`
16. `16-teacher-content-moderation.md` - audit `P1-15`
17. `17-catalog-seed-data.md` - audit `P1-16`

## Intentionally Excluded Closed Items

- Production mock auth rejection
- Client autosave stale-write protection
- Client submission/revision durable-truth improvements
- Strict lint gate
- Expo Doctor dependency alignment
- API client hardening
- Grades 1-2 onboarding
- Runtime dead actions and canvas tap dots
- Code-level accessibility consistency
- Unsupported locale selection
- List virtualization and canvas summary query pressure

Every agent should still verify current repository state before editing. If a prompt is stale because another agent already fixed the issue, update the relevant docs instead of reimplementing.
