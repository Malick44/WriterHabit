# WriterHabit — instructions for Claude

## Mobile screen layout: match the dashboard, always

Every top-level screen in `apps/mobile` must use the dashboard's header
structure. The canonical reference is
`apps/mobile/src/features/student-home/screens/StudentHomeScreen.tsx`;
`apps/mobile/src/features/grade3-writing-adventure/screens/Grade3LessonScreen.tsx`
shows the same pattern composed with the shared `Screen` component.

The required structure, top to bottom:

1. A root `View` with the screen's background color and `flex: 1`.
2. A top-edge-only `SafeAreaView` (`edges={["top"]}`) wrapping the header —
   the header owns the status-bar inset, nothing else does.
3. `<AppHeader variant="compact" showSafeArea={false} ...>` pinned there,
   with `style={{ backgroundColor: <screen background> }}` so it blends with
   the page. Titles/labels come from i18n keys (`titleKey`), never literals.
4. The scrollable content BELOW the header (via `Screen` with a small
   `contentPaddingTop`, or a `ScrollView`). The header must never scroll away
   with the content.
5. Optional footer (bottom bars) outside the scroll area.

Rules:

- Never hand-roll a different header arrangement per screen. If a screen
  needs something the pattern can't express, extend the shared components
  (`shared/components/navigation/app-header`, `shared/components/layout/Screen`)
  instead of diverging locally.
- Don't use `Screen`'s `title`/`subtitle` props as a substitute for the
  header bar on new screens — that renders a large inline heading that
  scrolls away and doesn't match the dashboard.
- Back/close/settings actions go in `AppHeader`'s `leftAction`/`rightActions`
  (typed `HeaderAction`s), not as ad-hoc buttons above the content.
- Planned: a `header` prop on `Screen` will encapsulate steps 1–3 so screens
  only declare header *content*. Once it lands, use it exclusively and update
  this rule.

## Other mobile conventions

- All styling comes from `apps/mobile/src/design/tokens/` (colors, spacing,
  radius, shadows, typography). No raw hex values, arbitrary spacing, or
  one-off radii in components.
- All user-facing strings (including `accessibilityLabel`s) come from i18n
  (`src/shared/i18n/en.ts`); `noHardcodedJsxText.test.ts` enforces this.
- Layering: route file → feature screen → components → hooks → services.
  Feature code never imports native/TTS/clipboard modules directly — it goes
  through the facades in `src/services/`.
- Read-aloud is on-device only (sherpa-onnx + react-native-track-player via
  `src/services/speech/readAloudService.ts`). There is no platform TTS
  fallback; do not reintroduce `expo-speech`.
