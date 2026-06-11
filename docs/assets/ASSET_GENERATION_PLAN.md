# Asset Generation Plan

This document tracks generated production-candidate visual assets for WriterHabit AI.

Current status: generated app assets, an auth login illustration, and auth screenshot concept assets exist.

## Canonical Paths

- Generated app assets: `apps/mobile/assets/generated/`
- Generated asset manifest: `apps/mobile/assets/generated/README.md`
- Asset planning document: `docs/assets/ASSET_GENERATION_PLAN.md`

## Rules

- Do not store generated assets under `apps/mobile/src/`.
- Use lowercase kebab-case filenames.
- Prefer `.png` for illustrations and thumbnails.
- Keep text out of generated images when possible so UI copy remains localizable.
- Do not generate imagery that implies AI completes student assignments.
- Update this file and the generated asset manifest whenever assets are added, replaced, or removed.

## Planned Asset Categories

| Category | Destination | Status |
| --- | --- | --- |
| Onboarding illustrations | `apps/mobile/assets/generated/onboarding/` | Partially complete (welcome-onboarding.png) |
| Empty states | `apps/mobile/assets/generated/empty-states/` | Partially complete (ai-coach-avatar.png) |
| Badges and rewards | `apps/mobile/assets/generated/badges/` | Partially complete (completion-trophy.png) |
| Canvas/template thumbnails | `apps/mobile/assets/generated/canvas-templates/` | Not started |
| Paywall visuals | `apps/mobile/assets/generated/paywall/` | Not started |
| Store screenshot support | `apps/mobile/assets/generated/store/` | Not started |
| Auth illustrations | `apps/mobile/assets/generated/auth/` | Partially complete (sign-in-coach-hero.png) |
| Auth screenshot design concepts | `apps/mobile/assets/generated/auth-screenshots/futuristic/` | Complete for Launch, Welcome, Sign In, Sign Up, and Not Found |

## Review Checklist

- Asset is appropriate for Grades 1-12.
- Asset matches the current design system and token direction.
- Asset remains legible at target mobile sizes.
- Asset avoids embedded text unless explicitly required.
- Asset has a clear destination path and manifest entry.
- Asset does not duplicate icon-library responsibilities.
