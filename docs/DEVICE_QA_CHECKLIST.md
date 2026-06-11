# Device QA Checklist

Status: ready to execute. Created 2026-06-11 to close the on-device verification gap from
`docs/APP_IMPLEMENTATION_AUDIT.md` (the residual half point on UI quality). Code-level review
cannot verify these items; each requires a physical device or simulator/emulator session.

Record results inline (pass/fail + device + OS version + date) and file failures in
`docs/KNOWN_ISSUES.md`.

## Device matrix

Minimum coverage; one row per session.

| Device class | Example | OS | Why |
| --- | --- | --- | --- |
| Small iPhone | iPhone SE (3rd gen) | latest iOS | Tightest layout, smallest safe areas |
| Large iPhone | iPhone 15 Pro Max | latest iOS | Large insets, Dynamic Island, tab bar safe area |
| iPad | iPad (10th gen) | latest iPadOS | Tablet layout (`supportsTablet` is enabled), 768pt breakpoints |
| Small Android | Pixel 4a / Galaxy A-series | Android 13+ | Low memory, small viewport |
| Large Android | Pixel 8 Pro | Android 14+ | Gesture nav insets, TalkBack |

## 1. Screen-reader passes (VoiceOver / TalkBack)

Run each flow end to end with the screen reader on. A pass means: every interactive element is
reachable in a sensible order, announces a meaningful label + role + state, and no decorative
element is announced.

- [ ] Onboarding: welcome → role (radiogroup) → grade (radiogroup) → goals (checkboxes with
      checked state) → daily practice → plan summary → home. Progress dots announce
      "progress bar, N of 5".
- [ ] Auth: sign-up (field labels, role picker selection state, validation errors announced as
      alerts), sign-in (login-link helper announced after send).
- [ ] Student home: all cards/buttons labeled; notification icon opens settings; tab bar
      announces tab names + selected state (Progress tab is a bar-chart icon, label "Progress").
- [ ] Writing workspace: editor focus, Save announces busy/disabled while saving, rubric
      progress announces "X of Y", AI Coach button reachable.
- [ ] Canvas: tool/color/width buttons announce names (color names, not hex) + selected state;
      drawing surface announces label + hint; save banner announced and auto-dismisses.
- [ ] AI review loading: checklist progress readable; completion announced ("Continue" CTA
      announcement fires without touching the screen).
- [ ] Feedback → revision → completion: revision editor reachable, autosave status truthful,
      celebration header reads name without stray glyph characters.
- [ ] Progress: bar chart announces per-day word counts; locked badges announce "locked";
      trend pill matches direction.
- [ ] Parent home + teacher dashboard: stats, rings, watchlist/activity (including empty
      states), settings reachable; sign-out reachable on both roles.
- [ ] Settings: every toggle announces switch role + checked state and toggles via double-tap;
      font-size row announces current value; accessibility settings screen fully operable.

## 2. Text size

For each: OS Dynamic Type at maximum AND in-app Settings → Accessibility text size at
Extra Large (they compound where uncapped).

- [ ] Onboarding + auth: titles (34-36pt base) scale without truncation; selection cards grow;
      no overlapping text.
- [ ] Student home: cards reflow, no clipped labels (multiplier caps were removed — verify
      nothing relies on them).
- [ ] Writing workspace: editor text scales; footer buttons keep 44pt+ and don't wrap off-screen.
- [ ] Progress + parent/teacher dashboards: ring center values shrink-to-fit instead of
      overflowing the ring; chart labels legible.
- [ ] Settings rows: labels wrap to two lines rather than truncating; switches stay aligned.

## 3. High contrast

In-app Settings → Accessibility → high contrast ON:

- [ ] AI review loading screen fully readable (regression check: was white-on-white).
- [ ] Onboarding titles/subtitles, assignment detail body, parent/teacher dashboard text switch
      to the high-contrast scheme.
- [ ] Filled buttons (primary/danger) swap to the accessible scheme; pressed states stay visible.
- [ ] Canvas guide lines remain visible.

## 4. Reduced motion

OS reduce-motion ON and in-app setting ON:

- [ ] AI review loading: no pulse/rotation loops.
- [ ] Button/card press scale is disabled; progress bars update instantly.
- [ ] Modal/top-alert transitions are instant or fade-only.

## 5. Keyboard interaction

- [ ] Writing workspace: keyboard never covers the caret or the Save/Submit footer (iOS + Android).
- [ ] Sign-up: all four fields + submit reachable while keyboard is open.
- [ ] Revision screen: editor visible above keyboard; autosave badge visible.

## 6. Touch targets

Spot-check with the OS pointer/accessibility inspector — all interactive elements ≥ 44pt
(52pt for elementary band):

- [ ] Canvas toolbar buttons, back buttons, writing workspace AI Coach button, parent home text
      links, settings rows.

## 7. RTL smoke pass (pseudo-locale)

Only `en` ships, but chrome must not break under RTL devices:

- [ ] Back arrows mirror (onboarding frame, workspace, app header).
- [ ] Tab bar and header layouts don't overlap.

## 8. Screenshot matrix

Capture per device class (used for store listings and visual regression baseline):

- [ ] Welcome, sign-up, student home, writing workspace, canvas, feedback summary, progress,
      parent home, teacher dashboard, paywall — light mode, default text size.
- [ ] Student home + writing workspace at Extra Large text and at high contrast (2 extra shots
      each on one iOS and one Android device).

## 9. Platform/system checks

- [ ] Deep links open the right screen on both platforms (associated domains / intent filter).
- [ ] Backgrounding mid-draft (writing + canvas) and relaunching restores the draft.
- [ ] Offline banner appears when airplane-moded; saves queue and flush on reconnect.
- [ ] Low-memory device session (small Android): canvas with a long drawing session does not
      crash; lists stay responsive.

## Sign-off

| Pass | Device | OS | Tester | Date | Result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |
