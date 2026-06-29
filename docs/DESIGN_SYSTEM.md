# Design System

This document records the current shared UI foundation in the Expo mobile app.

## Brand Direction — "Daylight Glass"

WriterHabit AI should feel **educational, trustworthy, premium, and friendly** for Grades 1–12 students and their families. Light, airy surfaces with subtle glassmorphism accents — never dark-mode-first, neon, or sci-fi. Full per-feature design prompts (with screen briefs and variant directions) live in `docs/design-prompts/`; the screen-level visual spec is `apps/mobile/src/features/onboarding/prompts/DESIGN.md`.

Palette roles (values are the canonical tokens in `apps/mobile/src/design/tokens/colors.ts`):

- **Indigo/blue `#2563EB`** — primary interactive color, selection, focus (tints `#DBEAFE`, `#EFF6FF`).
- **Teal `#14B8A6` / green `#16A34A`** — progress and success only.
- **Warm yellow `#F59E0B`** — streaks, points, badges, rewards only.
- **Soft salmon/red `#DC2626`** — error states only, never decoration.
- **Surfaces** — app background `#F6FAFF`, cards `#FFFFFF`/`#FCFEFF`; text slate `#0F172A` / `#475569` / `#94A3B8`.

Voice and integrity rules that bind UI copy:

- **Coaching, not completion.** Approved coach CTAs only: "Give me a hint", "Help me brainstorm", "Check my sentence", "Explain this mistake", "Help me revise", "Suggest a stronger word", "Ask me a question". Never "Write my essay", "Finish for me", "Do my homework", or similar.
- Warm, motivating success copy ("Streak Active", "Daily Rhythm", "Skill Milestone"); calm, empathetic recovery copy ("You're offline, but your draft is safe on your device."); anticipation cues while processing ("Crafting your feedback card...").
- Every screen ships with loading skeleton, empty, error, and offline states.

## Canonical Token Path

Design tokens live in:

```txt
apps/mobile/src/design/tokens/
```

Current token modules:

```txt
apps/mobile/src/design/tokens/colors.ts
apps/mobile/src/design/tokens/typography.ts
apps/mobile/src/design/tokens/spacing.ts
apps/mobile/src/design/tokens/radius.ts
apps/mobile/src/design/tokens/shadows.ts
apps/mobile/src/design/tokens/motion.ts
apps/mobile/src/design/tokens/index.ts
```

The legacy shared theme path remains as compatibility exports:

```txt
apps/mobile/src/shared/theme/
```

New code should import tokens from `@/design/tokens` unless it is maintaining existing shared-theme imports.

## Grade Adaptation

Typography supports the product grade bands:

- `elementary`: Grades 1-5, larger text and controls.
- `middle`: Grades 6-8, balanced reading density.
- `high`: Grades 9-12, more compact productivity-focused density.

Use `getGradeBandForGrade`, `getTypographyForGrade`, or `typography.gradeBands` from `@/design/tokens`.

## Motion

Motion tokens use explicit names:

- `duration.sm`
- `easing.standard`
- `spring.cardPress`
- `spring.playerTransition`

These tokens are available from `apps/mobile/src/design/tokens/motion.ts`.

## Shared Components

Shared, feature-agnostic UI components live in:

```txt
apps/mobile/src/shared/components/layout/
apps/mobile/src/shared/components/buttons/
apps/mobile/src/shared/components/cards/
apps/mobile/src/shared/components/forms/
apps/mobile/src/shared/components/feedback/
apps/mobile/src/shared/components/modals/
apps/mobile/src/shared/components/navigation/
```

Current primitives include:

- Layout: `Screen`, `Stack`, `Inline`, `PageSection`
- Buttons: `Button`, `PrimaryButton`
- Cards: `Card`, `InfoCard`
- Forms: `FormField`, `TextField`, `ChoiceCard`, `CheckboxRow`
- Feedback: `LoadingState`, `EmptyState`, `ErrorState`, `SuccessState`, `StatusState`, `OfflineBanner`, `RetryButton`, `ProgressBar`
- Top alerts: `TopAlertBanner`, `TopAlertProvider`, `useTopAlert`, `showTopAlert`, `hideTopAlert`
- Modals: `Modal`, `BottomSheetModal`, `ModalProvider`, `useModal`, `modalManager`
- Navigation: `AppHeader`, `RoleBottomMenu`

`GlassSurface` in `apps/mobile/src/shared/components/layout/GlassSurface.tsx`
is the shared Liquid Glass wrapper. It uses `expo-glass-effect` on iOS when
Liquid Glass is available, respects the iOS reduce-transparency setting, and
falls back to a normal React Native `View` on unsupported platforms or older
native binaries. Feature code should compose this shared wrapper instead of
importing `expo-glass-effect` directly. Current adoption is limited to the
shared role-aware bottom navigation surface.

Shared components accept user-facing labels and messages as props so feature screens can source copy from `apps/mobile/src/shared/i18n/`.

## App Header

The reusable screen header system lives in:

```txt
apps/mobile/src/shared/components/navigation/app-header/
  AppHeader.tsx
  AppHeaderAction.tsx
  AppHeaderTitle.tsx
  AppHeaderProgress.tsx
  appHeader.constants.ts
  appHeader.styles.ts
  appHeader.types.ts
  index.ts
```

The public API is typed around `TranslationKey`, so title, subtitle, action labels, accessibility labels, and progress labels resolve through `apps/mobile/src/shared/i18n/`.

`colorOverrides?: Partial<AppHeaderResolvedColors>` merges over the resolved
variant/scheme palette (background, border, text, mutedText, action colors,
progress colors). The dev theme tuner uses it to live-tune header colors;
production callers normally omit it.

```ts
import { AppHeader } from "@/shared/components/navigation";

<AppHeader
  variant="large"
  titleKey="studentHome.title"
  subtitleKey="studentHome.description"
  leftAction={{
    accessibilityLabelKey: "common.back",
    type: "back",
  }}
  rightActions={[
    {
      accessibilityLabelKey: "common.notifications",
      icon: "notifications-outline",
      onPress: openNotifications,
      type: "icon",
    },
  ]}
/>;
```

Usage patterns:

```ts
// Home screen
<AppHeader
  variant="large"
  titleKey="studentHome.title"
  subtitleKey="studentHome.description"
  rightActions={[
    { accessibilityLabelKey: "common.notifications", icon: "notifications-outline", onPress: openNotifications, type: "icon" },
  ]}
/>;

// Detail screen
<AppHeader
  titleKey="assignments.detail.title"
  subtitleKey="assignments.detail.subtitle"
  leftAction={{ accessibilityLabelKey: "common.back", type: "back" }}
/>;

// Modal screen
<AppHeader
  variant="centered"
  titleKey="modal.examples.deleteTitle"
  subtitleKey="modal.examples.deleteDescription"
  leftAction={{ accessibilityLabelKey: "common.close", onPress: closeModal, type: "close" }}
/>;

// Onboarding screen
<AppHeader
  variant="transparent"
  titleKey="onboarding.roleSelection.title"
  subtitleKey="onboarding.roleSelection.description"
  progress={{ labelKey: "onboarding.progressLabel", showValue: true, value: onboardingProgress }}
/>;

// Profile screen
<AppHeader
  titleKey="profileSettings.studentProfileTitle"
  subtitleKey="profileSettings.studentProfilePlaceholderDescription"
  rightActions={[
    { accessibilityLabelKey: "studentHome.profile.accessibilityLabel", fallbackText: studentInitial, onPress: openProfile, type: "avatar" },
  ]}
/>;
```

Supported variants:

- `default`
- `large`
- `compact`
- `centered`
- `transparent`
- `blurred`
- `floating`

Supported actions:

- `none`
- `back`
- `close`
- `icon`
- `avatar` with either `imageUri` or localized-user-data fallback text such as a student initial
- `text`

Current adoption:

- `apps/mobile/src/features/student-home/screens/StudentHomeScreen.tsx` uses `AppHeader` for the home greeting and profile action.
- `apps/mobile/src/features/assignments/screens/AssignmentDetailScreen.tsx` uses `AppHeader` for the detail back/title/action row.
- `apps/mobile/src/features/assignments/screens/AssignmentHistoryScreen.tsx` uses `AppHeader` for the assignment history title and subtitle.
- `apps/mobile/src/features/progress/screens/StudentProgressScreen.tsx`, `BadgesScreen.tsx`, `WeeklyReviewScreen.tsx`, and `SkillDetailScreen.tsx` use `AppHeader` for progress dashboard and drill-in headers.
- `apps/mobile/src/features/profile-settings/screens/StudentProfileScreen.tsx`, `AppSettingsScreen.tsx`, and `AccessibilitySettingsScreen.tsx` use `AppHeader` for profile and settings headers.
- `apps/mobile/src/features/parent/screens/ParentSettingsScreen.tsx` uses `AppHeader` for parent settings.

Assignment detail intentionally does not expose a bookmark action yet. Bookmarking is deferred until the assignment feature has a backend-backed saved-assignment model, saved-list navigation, offline semantics, and RLS policy.

Design and accessibility behavior:

- Header colors, spacing, shadows, radius, and typography resolve through `apps/mobile/src/design/tokens/`.
- Safe-area top insets are included by default with `showSafeArea`.
- Back icons mirror under RTL through `I18nManager`.
- Title and subtitle support long translated text with bounded line counts.
- Actions use localized accessibility labels and the shared minimum touch target.
- Optional progress uses `accessibilityRole="progressbar"` and localized labels.

Testing strategy:

- `AppHeader.test.tsx` covers localized title/subtitle/action rendering, back navigation fallback, icon and avatar action accessibility labels, and progress accessibility metadata.
- `noHardcodedJsxText.test.ts` continues to guard hardcoded visible JSX copy and accessibility props.

## Development Theme Tuning

The development-only theme tuner is mounted from `apps/mobile/app/_layout.tsx`
through `ThemeTuningPanel` from `apps/mobile/src/devtools/theme-tuner/`. It is
guarded by `__DEV__` at the mount point and inside the component, never renders
in production builds, and stores overrides separately from the source tokens.

The token-based tuner module layout:

```txt
apps/mobile/src/devtools/theme-tuner/
  components/   ThemeTuningPanel, TokenEditor, ScreenRegistryView, ComponentInspector
  store/        themeTunerStore (zustand + localJsonStorage persistence)
  registry/     screenRegistry, componentRegistry
  hooks/        useRegisterTunableScreen, useRegisterTunableComponent(s), useTunableToken(s)
  types.ts      TokenKind, TunableScreenConfig, TunableComponentConfig, TokenOverrides
```

Usage:

- A screen registers token definitions with `useRegisterTunableScreen(config)`
  and section-level groups with `useRegisterTunableComponents(configs)`.
- Screens read live values with `useTunableTokens(screenId, defaults)` or the
  raw override map with `useTunableTokenOverrides(screenId)` plus
  `overrideStyle(...)`, which resolves to `null` when nothing is tuned.
- The panel supports per-token reset, per-screen reset, reset all, and
  export of the override map as JSON (selectable text, native share sheet, and
  Metro console log).
- Dev overrides persist across reloads via
  `apps/mobile/src/services/storage/localJsonStorage.ts` under
  `devtools.themeTuner.overrides.v1`.

`StudentHomeScreen` registers the `student-home` screen with header, today's
assignment card, weekly progress cards, skill progress preview, continue draft
card, recent feedback card, and bottom navigation components. Its tunable
tokens cover screen/card surfaces, card border and radius, title/body sizes
and line heights,
primary/secondary text, primary button color, accent cyan, achievement gold,
progress green, card padding, section spacing, and tab bar colors (applied in
`apps/mobile/app/(student)/_layout.tsx`).

The legacy Glacier control-based tuner remains available; its registered
screens appear in the new panel under a legacy section and open the Glacier
panel. The base Glacier theme store lives in:

```txt
apps/mobile/src/shared/theme/glacierThemeStore.ts
apps/mobile/src/shared/theme/themeTuningHooks.ts
```

The store keeps global fallback values for older screens and a screen-aware
registry for screens that opt into dynamic tuning. A screen registers a
`ThemeTuningScreenConfig` with `useThemeTuningScreen(config)` and reads merged
defaults plus overrides with `useScreenThemeValues(screenId, defaults)`.

`ThemeTuningPanel` renders the active screen's registered controls grouped by
screen, components, text, and icons. If the active screen has not registered a
config, the panel falls back to global Glacier controls.

`DailyPracticeGoalScreen` currently registers controls for:

- screen background and accent color
- summary and option card surfaces
- option spacing and corner radius
- primary and muted text colors
- title and body scale
- icon color, icon surface, and icon scale

All tuner labels, screen names, control names, and preset names use translation
keys in `apps/mobile/src/shared/i18n/en.ts`.

## Top Alert Banner System

The reusable top-of-screen alert system lives in:

```txt
apps/mobile/src/shared/components/feedback/top-alert/
  TopAlertBanner.tsx
  TopAlertProvider.tsx
  TopAlertContext.tsx
  topAlert.constants.ts
  topAlert.styles.ts
  topAlert.types.ts
  topAlertManager.ts
  topAlertQueue.ts
  useTopAlert.ts
  index.ts
```

`TopAlertProvider` is installed in `apps/mobile/src/core/providers/AppProviders.tsx`, inside `GestureHandlerRootView`, `I18nProvider`, and `AccessibilitySettingsProvider`. It renders a single mounted banner only while an alert is active, then advances queued alerts.

Public API:

```ts
import { showTopAlert, useTopAlert } from "@/shared/components/feedback/top-alert";

showTopAlert({
  type: "success",
  titleKey: "alerts.examples.profileSaved.title",
  descriptionKey: "alerts.examples.profileSaved.description",
  actionLabelKey: "alerts.examples.profileSaved.action",
});

const topAlert = useTopAlert();
topAlert.show({
  type: "warning",
  titleKey: "alerts.examples.unsavedChanges.title",
  descriptionKey: "alerts.examples.unsavedChanges.description",
  actionLabelKey: "alerts.examples.unsavedChanges.action",
  autoDismissMs: 5000,
});
```

Supported variants:

- `success`
- `error`
- `warning`
- `info`
- `neutral`
- `offline`
- `loading`

Design and theme behavior:

- Alert colors resolve through `apps/mobile/src/design/tokens/colors.ts`, including feedback and palette tokens.
- `compact` and `expanded` variants share the same shell but vary vertical density and description visibility.
- Banners respect safe-area top insets and render as a floating rounded card.
- `colorScheme="dark"` switches the token mapping to dark surfaces while keeping high-contrast support through accessibility settings.

Performance behavior:

- Only the active alert is mounted.
- Alerts are queued with `TopAlertQueue`; identical alerts are deduplicated within a short window.
- Auto-dismiss timers are cleared on pause, dismissal, and unmount.
- Reanimated shared values drive slide, fade, scale, and swipe-up dismissal.
- Gesture callbacks pause auto-dismiss while the banner is pressed or dragged.

Accessibility behavior:

- Alert copy, action labels, close labels, and hints are `TranslationKey` values.
- Banners use `accessibilityRole="alert"` and announce the resolved title/description when shown.
- Close and action controls use localized accessibility labels and at least the shared minimum touch target.
- RTL layout is mirrored with `I18nManager.isRTL`; long translated title/description/action text can wrap without breaking the shell.

Testing strategy:

- `topAlertQueue.test.ts` covers activation, queue advancement, deduplication, and queue size limits.
- `TopAlertProvider.test.tsx` covers rendering each alert type, auto-dismiss, manual dismissal, action press, accessibility labels, and timer cleanup.
- `noHardcodedJsxText.test.ts` continues to guard visible copy and accessibility props.

## Modal System

The reusable modal system lives in:

```txt
apps/mobile/src/shared/components/modals/
  Modal.tsx
  BottomSheetModal.tsx
  ModalProvider.tsx
  modalManager.ts
  types.ts
  useModal.ts
  index.ts
```

`ModalProvider` is installed in `apps/mobile/src/core/providers/AppProviders.tsx` inside the i18n and accessibility providers. The app root is wrapped with `GestureHandlerRootView` so modal swipe gestures work reliably under React Native New Architecture.

The public API is typed around `TranslationKey` from `apps/mobile/src/shared/i18n/types.ts`. Visible modal copy should use keys such as:

```ts
import { Modal, useModal } from "@/shared/components/modals";

<Modal
  visible={visible}
  titleKey="modal.examples.deleteTitle"
  subtitleKey="modal.examples.deleteDescription"
  onClose={handleClose}
>
  {content}
</Modal>;

const modal = useModal();
const confirmed = await modal.confirm({
  titleKey: "modal.examples.deleteTitle",
  subtitleKey: "modal.examples.deleteDescription",
  confirmLabelKey: "modal.confirm",
  cancelLabelKey: "modal.cancel",
  destructive: true,
});
```

Supported surfaces:

- Alert and confirmation helpers through `useModal()` and `modalManager`.
- Composed content, forms, onboarding dialogs, paywalls, and settings panels through `Modal`.
- Bottom sheets through `mode="bottomSheet"` or `BottomSheetModal`.
- Full-screen overlays through `mode="fullScreen"`.
- Sticky footers through `footer` or localized `actions`.
- Dark modal surfaces through `colorScheme="dark"`.

Performance choices:

- Modal children are only rendered while the modal is mounted for open or close animation.
- Heavy content can be deferred with `renderContent`.
- Open, close, backdrop fade, and drag progress use Reanimated shared values.
- Gesture dismissal is velocity and distance based, and animations are cancelled on unmount.
- Provider methods are memoized, and footer actions are memoized to limit avoidable re-renders.
- Scroll and footer layout use stable bounds instead of measuring content during animation.

Accessibility choices:

- Titles, subtitles, close labels, hints, and actions use translation keys.
- `NativeModal`, `accessibilityViewIsModal`, title announcement, and initial title focus are used when a modal opens.
- Android hardware back, iOS accessibility escape, backdrop tap, close button, and swipe all route through one typed close path.
- `dismissible={false}` blocks accidental backdrop, hardware-back, and swipe dismissal.
- Large text is supported through shared accessibility text utilities; content remains scrollable with sticky footer actions.
- RTL is supported by using translation keys, runtime i18n rendering, and mirrored header direction.

Testing strategy:

- `apps/mobile/src/shared/components/modals/modalManager.test.ts` covers global-manager registration and routing.
- `apps/mobile/src/shared/i18n/i18n.test.ts` covers legacy interpolation and ICU plural formatting used by modal copy.
- `apps/mobile/src/shared/i18n/noHardcodedJsxText.test.ts` guards against hardcoded visible JSX copy.
- Mobile checks should include `./script/build_and_run.sh --typecheck`, `./script/build_and_run.sh --test`, and targeted screen QA for gesture dismissal, hardware back, keyboard avoidance, RTL, and large text.

## Accessibility Rules

- Interactive shared controls set accessibility roles and labels.
- Buttons and selectable controls use at least the 44px minimum touch target, with larger elementary variants.
- Shared controls consume settings from `apps/mobile/src/shared/utils/accessibility.ts` for larger text, high contrast, touch targets, and readable text style.
- Progress uses `accessibilityRole="progressbar"` and percentage values.
- Error text and error states use alert semantics.
