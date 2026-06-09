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
```

Current primitives include:

- Layout: `Screen`, `Stack`, `Inline`, `PageSection`
- Buttons: `Button`, `PrimaryButton`
- Cards: `Card`, `InfoCard`
- Forms: `FormField`, `TextField`, `ChoiceCard`, `CheckboxRow`
- Feedback: `LoadingState`, `EmptyState`, `ErrorState`, `SuccessState`, `StatusState`, `ProgressBar`

Shared components accept user-facing labels and messages as props so feature screens can source copy from `apps/mobile/src/shared/i18n/`.

## Accessibility Rules

- Interactive shared controls set accessibility roles and labels.
- Buttons and selectable controls use at least the 44px minimum touch target, with larger elementary variants.
- Shared controls consume settings from `apps/mobile/src/shared/utils/accessibility.ts` for larger text, high contrast, touch targets, and readable text style.
- Progress uses `accessibilityRole="progressbar"` and percentage values.
- Error text and error states use alert semantics.
