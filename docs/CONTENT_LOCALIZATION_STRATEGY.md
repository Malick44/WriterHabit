# Content Localization Strategy

Last updated: 2026-06-11

This document defines how WriterHabit distinguishes client-localized copy from
server-authored content, closing audit finding P1-12 ("Service-generated user
copy is not fully localized") via the documented-strategy option.

## Two classes of user-facing text

### 1. App chrome copy (client-localized)

All static UI text — labels, buttons, headers, hints, errors, empty states,
accessibility labels — lives in `apps/mobile/src/shared/i18n/en.ts` and is
rendered through `useI18n().t(key)`. A Jest guard
(`shared/i18n/noHardcodedJsxText.test.ts`) fails the build when JSX contains
hardcoded English. Only locales with a complete dictionary are selectable in
language settings (`profileLanguageOptions`); legacy stored `es`/`fr`
preferences coerce to `en` until real dictionaries ship.

Adding a locale requires:

1. A complete dictionary module next to `en.ts` (same key shape, enforced by
   the `Dictionary` type).
2. Registering it in the `dictionaries` map in `shared/i18n/index.ts`.
3. Re-enabling the locale in `profileLanguageOptions`.

### 2. Server-authored content (translated at the source)

The following content is data, not chrome. It is authored or generated
server-side and is delivered already in the student's language. The client
renders it verbatim and must not attempt to re-translate it:

| Content | Source of truth | Localization mechanism |
| --- | --- | --- |
| Assignment titles, prompts, instructions | `assignments` table (`*_key` + `*_fallback` columns) | Backend resolves `title_key`/`prompt_fallback` etc. per locale; fallback columns carry English |
| Rubric criteria | `rubric_criteria` (`label_fallback`, `description_fallback`) | Same key+fallback pattern |
| AI feedback (strength, improvement, revision task) | `feedback`, `revision_tasks` (`*_key` + `*_fallback`) | AI provider is prompted with the student's locale; keys allow re-rendering canned content |
| Teacher comments and teacher-authored prompts | `teacher_submission_comments`, teacher-created `assignments` | User-authored content; displayed as written, never machine-translated silently |
| Student drafts/revisions | `writing_drafts`, `submission_revisions` | User-authored |
| Parent reports | Derived server-side from progress data | Generated per locale at request time once the reports backend ships |

The schema already encodes this strategy: every seeded/AI text column pairs a
translation `*_key` with an English `*_fallback`, so canned content can be
localized without schema changes.

## Current state and gaps

- The deterministic demo/mock APIs return English fallback strings directly.
  This mirrors the backend "fallback column" behavior and is acceptable while
  only `en` is selectable.
- Before enabling a second locale, the mock/demo facades must return
  localization keys (or locale-resolved strings) for all seeded content, and
  the backend must resolve `*_key` columns against translation tables.
