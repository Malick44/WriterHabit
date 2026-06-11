# WriterHabit AI — Daylight Glass

## North Star: "Calm Confidence"
A bright, trustworthy learning space. Light, airy surfaces with soft glass touches — educational, premium, and friendly for Grades 1–12 students and their families. Never neon, never dark-mode-first, never sci-fi.

## Colors (exact tokens from `@/design/tokens/colors`)
- **Primary (`#2563EB`):** Indigo/blue for interactive elements, focus, and selection. Pressed `#1D4ED8`; tints `#DBEAFE`, `#EFF6FF`.
- **Progress (`#14B8A6`):** Teal for skill growth and progress bars; success green `#16A34A` (tints `#F0FDFA`, `#DCFCE7`).
- **Reward (`#F59E0B`):** Warm yellow for streaks, points, and badges only (tint `#FEF3C7`).
- **Error (`#DC2626`):** Soft salmon/red on tint `#FEE2E2` — error states only, never decoration.
- **Surfaces:** App background `#F6FAFF`, cards `#FFFFFF`/`#FCFEFF`, canvas `#F8FAFC`.
- **Text:** Slate `#0F172A` primary, `#475569` secondary, `#94A3B8` muted.

## Glass Effect (Accent Pattern, not the whole UI)
- Use glassmorphism sparingly: translucent headers, bottom sheets, floating toolbars.
- **Glass surface:** `background: rgba(255, 255, 255, 0.7)`, `backdrop-filter: blur(16px)`, `border: 1px solid rgba(37, 99, 235, 0.08)`.
- Cards stay mostly opaque white with soft shadows; glass is a touch of polish, not a theme.

## Typography
- Modern high-readability face (Inter or similar). Headlines semibold, body regular, generous line height.
- **Grade adaptation:** Grades 1–5 get larger sizes and friendlier scale; Grades 6–8 balanced density; Grades 9–12 compact, productivity-focused. Resolve through `typography.gradeBands`.

## Elevation
- Depth through soft shadows on light surfaces, 16–24px card radii.
- Layer 0: `#F6FAFF` background. Layer 1: white card + soft shadow. Layer 2: glass sheet over dimmed scrim.
- No glow effects; selection reads through indigo tint fills and borders, not luminescence.

## Components
- **Buttons:** Primary = solid `#2563EB` with white text; secondary = `#EFF6FF` tint with indigo text; minimum 44px touch target (larger for elementary).
- **Cards:** White, rounded, soft shadow; selected state = `#DBEAFE` tint + `#2563EB` border.
- **Inputs:** White field, slate border, indigo focus ring; errors use salmon tint with calm copy.
- **Progress:** Teal bars/rings with `accessibilityRole="progressbar"`.

## Voice & Integrity (Non-Negotiable)
- Coaching, not completion: CTAs only from the approved set ("Give me a hint", "Help me brainstorm", "Check my sentence", "Explain this mistake", "Help me revise", "Suggest a stronger word", "Ask me a question"). Never "Write my essay" / "Do my homework".
- Copy is warm and motivating ("Daily Rhythm", "Skill Milestone"), calm in recovery ("You're offline, but your draft is safe on your device."), anticipatory while processing ("Crafting your plan...").

## Rules
- Error red appears only in error states; teal owns progress; yellow owns rewards.
- Always design loading skeletons, friendly empty states, and offline banners.
- Every screen must read implementation-ready: real copy, full navigation, believable content.
