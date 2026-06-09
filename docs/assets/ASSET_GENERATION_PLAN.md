# Asset Generation Plan

This document tracks generated production-candidate visual assets for WriteWise AI.

Current status: no generated app assets have been produced yet.

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
| Onboarding illustrations | `apps/mobile/assets/generated/onboarding/` | Not started |
| Empty states | `apps/mobile/assets/generated/empty-states/` | Not started |
| Badges and rewards | `apps/mobile/assets/generated/badges/` | Not started |
| Canvas/template thumbnails | `apps/mobile/assets/generated/canvas-templates/` | Not started |
| Paywall visuals | `apps/mobile/assets/generated/paywall/` | Not started |
| Store screenshot support | `apps/mobile/assets/generated/store/` | Not started |

## Review Checklist

- Asset is appropriate for Grades 1-12.
- Asset matches the current design system and token direction.
- Asset remains legible at target mobile sizes.
- Asset avoids embedded text unless explicitly required.
- Asset has a clear destination path and manifest entry.
- Asset does not duplicate icon-library responsibilities.
