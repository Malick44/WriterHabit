# Design System

This document records the current shared UI foundation in the Expo mobile app.

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
```

Current primitives include:

- Layout: `Screen`, `Stack`, `Inline`, `PageSection`
- Buttons: `Button`, `PrimaryButton`
- Cards: `Card`, `InfoCard`
- Forms: `FormField`, `TextField`, `ChoiceCard`, `CheckboxRow`
- Feedback: `LoadingState`, `EmptyState`, `ErrorState`, `SuccessState`, `StatusState`, `OfflineBanner`, `RetryButton`, `ProgressBar`
- Modals: `Modal`, `BottomSheetModal`, `ModalProvider`, `useModal`, `modalManager`

Shared components accept user-facing labels and messages as props so feature screens can source copy from `apps/mobile/src/shared/i18n/`.

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
