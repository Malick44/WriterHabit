# Design Prompt — WriterHabit AI Handwriting Canvas

## Goal

Design a premium, minimal **Handwriting Canvas** experience for WriterHabit AI.

This canvas is used by students to plan, sketch, handwrite ideas, outline thoughts, and draft visually before or during writing assignments.

The design must feel:

* Calm
* Premium
* Student-friendly
* Focused
* Easy to use
* Tablet-first
* Implementation-ready
* Not overloaded with tools

This should feel like a focused writing canvas, not a complex drawing app.

---

# Product Context

WriterHabit AI is an AI writing coach for Grades 1–12.

The canvas supports the writing flow:

**Assignment Detail → Writing Workspace → Canvas → Outline / Draft / Revise**

The canvas should help students think and write visually without distracting them from the assignment.

Primary emotional goal:

**“I can quickly map my ideas without fighting the tools.”**

---

# Visual System

Use the existing WriterHabit AI visual tokens:

* Primary Indigo: `#2563EB`
* Pressed Indigo: `#1D4ED8`
* Primary tint: `#DBEAFE`
* Soft primary tint: `#EFF6FF`
* Progress Teal: `#14B8A6`
* Success Green: `#16A34A`
* App background: `#F6FAFF`
* Card background: `#FFFFFF`
* Secondary card background: `#FCFEFF`
* Primary text: `#0F172A`
* Secondary text: `#475569`
* Muted text: `#94A3B8`
* Error Red: `#DC2626`
* Error tint: `#FEE2E2`

Use light premium surfaces, soft shadows, rounded controls, subtle glassmorphism, and native-feeling iOS/Expo patterns.

Avoid heavy toolbars, loud gradients, clutter, and anything that competes with the canvas.

---

# Required Screen

Design a screen titled:

**Canvas**

Assignment title:

**The Magic Forest Adventure**

Header must include:

* Back button
* Assignment title or compact assignment chip
* Autosave status pill: `Saved`, `Saving`, `Unsaved`, `Save failed`
* Optional page indicator: `Canvas page 1 of 2`

The main canvas should take most of the screen.

---

# Canvas Behavior

The canvas must support:

* Handwriting with pen
* Erasing strokes
* Changing pen size
* Choosing pen color
* Showing/hiding ruled lines
* Increasing/decreasing canvas height
* Hiding/showing the tool banner
* Moving the tool banner to different screen positions

The canvas should feel open and calm.

Use a very light paper-like surface, subtle shadow, and optional ruled lines.

---

# Minimal Tool Banner

Create a floating **minimal tool banner**.

The banner should include only:

1. **Pen**
2. **Eraser**
3. **Pen size slider control**
4. **Line toggle**
5. **Canvas height control**
6. **Banner position control**

Do not add extra drawing tools unless required.

No shapes, stickers, text boxes, layers, or complex drawing controls.

---

# Pen Tool

When Pen is selected:

* Pen button appears active using Primary Indigo.
* Eraser is inactive.
* User can write directly on canvas.
* Current color and pen size are reflected in the slider knob or nearby indicator.

Pen tool should feel simple and immediate.

---

# Eraser Tool

When Eraser is selected:

* Eraser button appears active.
* Pen becomes inactive.
* User can erase handwriting strokes.
* Keep eraser behavior simple and forgiving.

Optional:

* Show a small eraser size preview only if it does not clutter the UI.

---

# Dual-Purpose Pen Size Slider

Design the pen size slider as a premium compact control with two interaction modes.

## Interaction 1 — Press + Hold + Slide

When the user presses and holds the slider knob:

* Sliding left decreases pen size.
* Sliding right increases pen size.
* Show a live size preview near the knob.
* Preview can display values like:

`Thin`
`Medium`
`Bold`

or numeric values like:

`2 px`
`4 px`
`8 px`

The slider must feel smooth and touch-friendly.

## Interaction 2 — Tap Slider Knob

When the user taps the slider knob:

* Show or hide a compact color picker box.
* The color picker should appear near the slider knob.
* The box should not cover the main writing area unnecessarily.

The slider knob therefore has two purposes:

* **Press-hold-slide:** adjust pen size
* **Tap:** show/hide color picker

Make this interaction visually obvious with a small hint or microcopy:

**Tap for color · hold to resize**

Keep the hint subtle.

---

# Color Picker Box

The color picker box should be compact and elegant.

Include color dots:

* Indigo: `#2563EB`
* Teal: `#14B8A6`
* Green: `#16A34A`
* Yellow: `#F59E0B`
* Red: `#DC2626`
* Black / Ink: `#0F172A`
* Gray: `#475569`

Optional:

* Include a multicolor circle button for custom color.
* Current color should show a selected ring.
* Tapping outside closes the color picker.

Do not make the color picker feel like a full design tool.

---

# Tap Edge to Hide / Show Tool Banner

The user can tap any edge of the screen to hide or show the tool banner.

Supported edge tap zones:

* Top edge
* Bottom edge
* Left edge
* Right edge

Behavior:

* If the banner is visible, tapping an edge hides it.
* If the banner is hidden, tapping an edge shows it.
* When hidden, show a very small floating handle or pill on the chosen edge.
* The handle should be subtle and not distract from writing.

Example handle label:

**Tools**

or just a small icon.

The interaction should make the canvas feel distraction-free.

---

# Banner Position Control

The user must be able to choose where the tool banner lives.

Supported banner positions:

* Bottom
* Top
* Left
* Right

Design a compact banner position control.

Possible UI:

* Small four-direction icon
* Opens a mini position picker
* Picker shows four choices: `Top`, `Bottom`, `Left`, `Right`

Default position:

**Bottom**

When the banner moves:

* It should adapt layout orientation.
* Bottom/top banner uses horizontal layout.
* Left/right banner uses vertical layout.
* It must respect safe areas and not block iPhone home indicator or tablet gestures.

---

# Line Toggle

Add a button to show/hide ruled lines on the canvas.

Button label or icon:

**Lines**

Behavior:

* Tap once: show ruled lines
* Tap again: hide ruled lines

When lines are visible:

* Use very subtle light blue-gray lines.
* Do not make lines too dark.
* Lines should help handwriting alignment without feeling like a notebook template.

Optional states:

* Blank canvas
* Ruled lines
* Dotted guide lines

For MVP, only required state is:

**Show / Hide lines**

---

# Canvas Height Control

User must be able to increase or decrease canvas height.

Design a compact height control.

Possible UI:

* Button: `Canvas height`
* Opens a small control with:

  * `–`
  * current height label
  * `+`

Example labels:

* `Short`
* `Medium`
* `Long`
* `Extra long`

or:

* `1 page`
* `2 pages`
* `3 pages`

Behavior:

* Tap `+` to increase canvas height.
* Tap `–` to decrease canvas height.
* Canvas should visually expand downward.
* If content already exists near the bottom, decreasing height should not delete content accidentally.
* If needed, show a safe warning:

**This page has writing near the bottom. Increase height or move writing before shrinking.**

Keep this warning calm.

---

# Required Canvas States

Design these states:

## 1. Empty Canvas

Show a clean blank canvas with subtle prompt:

**Start mapping your idea here**

Optional helper:

**Use pen, eraser, or lines to plan before drafting.**

## 2. Canvas With Writing

Show sample handwriting strokes or simple sketch notes:

* “Magic forest”
* “glowing trees”
* “hidden path”
* “problem → solution”

The handwriting should look student-owned, not AI-generated.

## 3. Lines Enabled

Show the canvas with ruled lines visible.

## 4. Color Picker Open

Show the slider knob tapped and the color picker box open.

## 5. Banner Hidden

Show the canvas in distraction-free mode with only a small edge handle.

## 6. Banner Repositioned

Show the banner moved to the left or right edge.

## 7. Canvas Height Expanded

Show a longer canvas with page/height indicator.

---

# Required Interactions

Make the prototype clickable and realistic.

Interactions:

* Back button returns to Writing Workspace.
* Pen selects handwriting mode.
* Eraser selects erase mode.
* Press-hold-slide on slider changes pen size.
* Tap slider knob opens/closes color picker.
* Color selection changes active pen color.
* Tap Lines button shows/hides ruled lines.
* Tap Canvas Height control opens height options.
* Tap `+` increases canvas height.
* Tap `–` decreases canvas height safely.
* Tap any screen edge hides/shows tool banner.
* Position control moves banner to Top / Bottom / Left / Right.
* Autosave pill cycles through Saved / Saving / Unsaved / Save failed.

---

# Layout Requirements

The canvas should be the hero.

Priority order:

1. Canvas writing surface
2. Minimal tool banner
3. Autosave confidence
4. Page/height controls
5. Color picker
6. Secondary settings

Do not let tools dominate the page.

The screen should still feel usable for younger students.

Touch targets must be large enough for finger and Apple Pencil-style input.

---

# Tablet and Phone Behavior

## Tablet

Tablet should be the primary design target.

* Prefer landscape orientation.
* Canvas should feel spacious.
* Floating banner can sit at bottom or side.
* Left/right banner position should feel natural.
* Height controls should be easy to reach.

## Phone

Phone should still be supported.

* Keep the banner compact.
* Avoid covering too much canvas.
* Use bottom banner by default.
* Color picker should appear above the banner.
* Edge handle should be small and easy to recover.

---

# Accessibility

Include:

* Large tap targets
* High contrast active states
* Clear selected tool state
* VoiceOver-friendly labels
* No color-only state changes
* Haptic feedback suggestions for:

  * Tool selection
  * Color selection
  * Slider size change
  * Banner hide/show
  * Line toggle

---

# Engineering Readiness

Design reusable components for React Native / Expo:

* `HandwritingCanvasScreen`
* `CanvasHeader`
* `CanvasSurface`
* `FloatingToolBanner`
* `CanvasToolButton`
* `PenSizeSlider`
* `ColorPickerPopover`
* `LineToggleButton`
* `CanvasHeightControl`
* `BannerPositionPicker`
* `EdgeRevealHandle`
* `AutosavePill`

Implementation expectations:

* Keep canvas logic separated from UI controls.
* Use shared WriterHabit tokens.
* Keep all user-facing strings localization-ready.
* Do not hardcode strings inside components if the app already has i18n.
* Preserve safe areas.
* Preserve gesture behavior.
* Avoid unnecessary dependencies.
* Do not refactor unrelated files.
* If unrelated issues are found, report them but do not change unrelated code.

---

# Final Expected Result

Create a premium, minimal, clickable Handwriting Canvas prototype that includes:

* Full canvas screen
* Minimal floating tool banner
* Pen tool
* Eraser tool
* Dual-purpose pen size slider
* Tap-to-open color picker
* Show/hide ruled lines
* Increase/decrease canvas height
* Tap-edge hide/show banner behavior
* Banner position picker
* Empty, writing, lines, color picker, hidden banner, repositioned banner, and expanded-height states
* WriterHabit AI visual system
* Tablet-first layout
* Phone-safe adaptation
* Engineering-ready component structure

Most important principle:

**Keep the canvas central. Make tools feel invisible until needed. Help students think visually without slowing them down.**
