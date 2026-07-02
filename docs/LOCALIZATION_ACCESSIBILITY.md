# Localization And Accessibility

This document records the current localization and accessibility foundation for `apps/mobile/`.

## Canonical Localization Path

Use the shared i18n module for new app copy:

```txt
apps/mobile/src/shared/i18n/en.ts
apps/mobile/src/shared/i18n/types.ts
apps/mobile/src/shared/i18n/index.ts
apps/mobile/src/shared/i18n/useT.ts
```

Compatibility exports remain in:

```txt
apps/mobile/src/i18n/index.tsx
apps/mobile/src/i18n/locales/en.ts
```

New feature code should prefer:

```ts
import { useT } from "@/shared/i18n/useT";
```

Existing route layouts may still import `useI18n` from `@/i18n`; that path re-exports the shared provider.

## Copy Rules

- Do not hardcode new user-facing strings in JSX.
- Add keys to `apps/mobile/src/shared/i18n/en.ts`.
- Shared modals require at least `modal.close`, `modal.confirm`, and `modal.cancel`; close hints and example keys are also grouped under `modal`.
- Shared top alerts use the `alerts` namespace for dismiss labels and example alert copy. Alert options accept `TranslationKey` fields such as `titleKey`, `descriptionKey`, `actionLabelKey`, `accessibilityLabelKey`, `closeAccessibilityLabelKey`, and `closeAccessibilityHintKey`.
- Keep keys grouped by feature area, such as `assignments`, `writingWorkspace`, `canvas`, `aiCoach`, `parent`, `teacher`, and `accessibility`.
- Keep AI coaching copy learning-oriented. Do not add CTAs such as "Write my essay", "Finish for me", "Give me the answer", "Generate final draft", or "Do my homework".
- Prefer screen-owned copy keys over shared component-owned copy. Shared components should receive labels and messages as props.
- The Jest guard at `apps/mobile/src/shared/i18n/noHardcodedJsxText.test.ts` scans `apps/mobile/src/` and `apps/mobile/app/` TSX files for direct `<Text>` copy and common user-facing literal props. Use translation keys for those values so the normal test suite catches regressions.
- Service-generated user-facing labels, fallback names, and seeded form text should also resolve through translation keys. Protocol strings such as routes, enum values, IDs, API paths, and test IDs are not localization copy.

The formatter supports both existing `{{name}}` templates and ICU-style variables, plurals, and selects. New modal copy may use ICU plural formatting, for example:

```ts
modal: {
  close: "Close",
  confirm: "Confirm",
  cancel: "Cancel",
  examples: {
    selectionCount: "{count, plural, one {# selected item} other {# selected items}}",
  },
}
```

Modal props accept `TranslationKey` values, so invalid modal copy keys fail TypeScript compilation.

Top alert options also accept `TranslationKey` values. Example:

```ts
showTopAlert({
  type: "success",
  titleKey: "alerts.examples.profileSaved.title",
  descriptionKey: "alerts.examples.profileSaved.description",
  actionLabelKey: "alerts.examples.profileSaved.action",
});
```

## Theme Tuner Copy

The development theme tuner uses typed translation keys for all visible panel
copy. Screen-specific configs should declare `titleKey`, `descriptionKey`,
control `labelKey` values, and preset `labelKey` values from
`apps/mobile/src/shared/i18n/en.ts`.

When a screen registers with `useThemeTuningScreen(config)`, the tuner only
shows controls for that active screen. Unregistered screens continue to show the
global fallback controls.

## Accessibility Settings

Accessibility preferences are owned by profile settings:

```txt
apps/mobile/src/features/profile-settings/accessibility/accessibilitySettingsStore.ts
apps/mobile/src/features/profile-settings/accessibility/AccessibilitySettingsProvider.tsx
```

The store persists locally for recovery through:

```txt
apps/mobile/src/services/storage/preferencesStorage.ts
```

For signed-in student sessions, the same settings sync to
`student_profiles.accessibility_settings` through RLS-protected Supabase profile
updates.

Supported settings:

- `textSize`: `default`, `large`, or `extraLarge`
- `dyslexiaFriendlyFont`
- `highContrast`
- `reducedMotion`
- `textToSpeech`
- `speechToText`
- `simplifiedUi`

The provider is installed in:

```txt
apps/mobile/src/core/providers/AppProviders.tsx
```

## Shared Accessibility Utilities

Reusable helpers live in:

```txt
apps/mobile/src/shared/utils/accessibility.ts
```

Use these helpers for shared UI and future feature screens:

- `useAccessibilityContext`
- `getAccessibleTextStyle`
- `getAccessibleColors`
- `getMinimumTouchTarget`
- `getAccessibleHitSlop`
- `getMotionDuration`
- `buildAccessibilityLabel`
- `mergeAccessibilityState`

## Shared UI Behavior

Current shared components consume accessibility settings for text scale, touch target sizing, hit slop, high contrast, and readable text style:

```txt
apps/mobile/src/shared/components/layout/Screen.tsx
apps/mobile/src/shared/components/buttons/Button.tsx
apps/mobile/src/shared/components/forms/
apps/mobile/src/shared/components/feedback/
```

`OfflineBanner` and `RetryButton` are shared feedback primitives. Feature screens
must still pass localized titles, descriptions, action labels, and
accessibility labels from `apps/mobile/src/shared/i18n/en.ts`.

Future shared controls should:

- Set practical React Native accessibility roles.
- Set labels on interactive controls.
- Set `accessibilityState` for disabled, selected, checked, busy, and expanded states.
- Keep touch targets at least 44px and use larger targets when accessibility settings request them.
- Use `getMotionDuration` for nonessential motion.
- Source visible copy from i18n keys supplied by feature screens.

## Known Constraint

`dyslexiaFriendlyFont` currently applies a simpler system-font style with roomier spacing. A dedicated bundled dyslexia-friendly font asset has not been added yet.
