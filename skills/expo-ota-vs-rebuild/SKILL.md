---
name: expo-ota-vs-rebuild
description: Decide whether a WriteWise mobile change can ship as an Expo OTA update (eas update) or requires a new native build (eas build / store submission). Use whenever you add or change a dependency, native module, Expo config plugin, app.json/app.config, permissions, entitlements, deep links, splash/icon, or anything that touches the native layer. Output should classify the change as OTA-safe, dev-build-required, or rebuild-and-resubmit, with the reason.
---

# Expo OTA vs Rebuild

WriteWise ships as an Expo + Expo Router app (`apps/mobile`). Most product work is
JavaScript/TypeScript and can ship instantly over the air with `eas update`. But a
class of changes touches the **native runtime** and will silently break — or simply
not apply — if pushed as an OTA update over a build that does not contain the matching
native code.

This skill exists to answer one question before a change ships:

> **Can this go out as an OTA update, or does it need a new native build (and possibly an App Store / Play resubmission)?**

## When to Use

Use this skill when a change involves any of:

- adding, removing, or upgrading a dependency in `apps/mobile/package.json`
- adding or changing an Expo config plugin or anything in `app.json` / `app.config.*`
- a new native permission (camera, photo library, microphone, notifications)
- the canvas/drawing native layer, file system, or image/preview export pipeline
- `expo-secure-store`, secure storage, or keychain/keystore configuration
- push notification setup, deep links / universal links, URL schemes, associated domains
- app icon, splash screen, bundle identifier, app name, or version/build number
- the Expo SDK version, React Native version, or Hermes/JSC engine
- EAS build profiles, entitlements, or signing

Do **not** spin up this skill for pure JS/TS feature work (screens, hooks, API calls,
Zustand stores, styling, copy, validation) — those are OTA-safe by default. Just
confirm and move on.

## The Core Rule

**OTA updates only replace the JavaScript bundle and assets. They cannot change native code.**

If the change requires new native code, a new entry in `app.json`, a new permission
string, or a different SDK/RN version than what is already compiled into the installed
binary, then an OTA update will not deliver it. At best it does nothing; at worst the
JS references a native module that isn't in the binary and the app crashes on launch.

The runtime fingerprint (Expo's "runtime version") must match between the build and the
update. Anything that changes the native fingerprint forces a new build.

## Decision Procedure

For the change under review, classify it into exactly one bucket:

### 1) OTA-safe (`eas update`)
Ships instantly to existing installs. Use for:
- Screens, components, hooks, services written in TS/JS
- Expo Router route changes that only re-map to existing feature screens
- TanStack Query / Zustand / React Hook Form / Zod logic
- Styling, theme tokens, copy, localization strings
- Bundled JS assets (images already shipped through the bundler, fonts loaded at runtime via JS)
- Bug fixes that do not touch native modules or `app.json`

### 2) Dev-build / new build required (internal install, no store review needed yet)
A new native binary must be installed, but it can be a dev build / internal
distribution. Use for:
- Adding or upgrading any package that ships native code or an Expo config plugin
- Changing the Expo SDK or React Native version
- Adding/altering a config plugin, `app.json` native fields, or build properties
- Enabling a native capability that wasn't compiled in before (e.g. a canvas/handwriting
  native renderer, file-system access, image export native module)

### 3) Rebuild **and** store resubmission required
A new build that must go through App Store / Play review before users get it. Use for:
- New runtime permissions (camera, microphone, photo library, notifications) — these
  change the native permission manifest and require store review
- New entitlements, associated domains / universal links, push notification capability
- Bundle identifier, app name, app icon, or splash changes that are part of the binary
- Anything in bucket 2 that ships to production users (not just internal testers)

## WriteWise-Specific Watch List

These are the parts of this app most likely to cross the native boundary:

- **Canvas / handwriting** (`features/canvas`): if the drawing surface, stroke
  rendering, or `canvasExportService` / preview-image generation moves from a JS
  implementation to a native drawing library, that is **rebuild-required**. Pure stroke
  serialization and autosave logic in TS stays OTA-safe.
- **Secure storage**: `expo-secure-store` is already a dependency. Using it from JS is
  OTA-safe; adding a *new* native secure-storage/keychain plugin is not.
- **Canvas file export / object storage**: adding native image compression, a file
  picker, or a camera capture flow for "annotate a passage" is rebuild-required.
- **Push notifications** (parent/teacher alerts, daily practice reminders): first-time
  setup of `expo-notifications`, the permission prompt, and APNs/FCM config is
  **rebuild-and-resubmit**. Changing notification *content* built in JS is OTA-safe.
- **Deep links** into assignments/review screens: adding a new URL scheme or associated
  domain is rebuild-required; routing logic for an already-registered scheme is OTA-safe.
- **Subscriptions / paywall**: a native IAP/purchases SDK is rebuild-required; the
  paywall UI and entitlement-check JS is OTA-safe.

## How to Verify

Before classifying as OTA-safe, confirm the change does **not**:

1. add/remove/upgrade a line in `apps/mobile/package.json` for a package with native code
2. modify `app.json` / `app.config.*` native fields or add a config plugin
3. introduce a new permission usage-description string
4. change the Expo SDK / React Native version

If all four are clean, it is OTA-safe. If any are dirty, it needs a new build — then
decide between dev-build (internal) and rebuild-and-resubmit (production / new
permission / new entitlement).

When in doubt, treat it as rebuild-required. Shipping a native-dependent change as OTA
is the failure mode that crashes users on launch.

## Required Output Format

When this skill is used, end with a **Deployment Impact** section:

1. **Classification** — OTA-safe / dev-build required / rebuild-and-resubmit
2. **Reason** — which specific change crossed (or did not cross) the native boundary
3. **What ships how** — which parts can go OTA now vs which wait for the next build
4. **Action** — `eas update`, `eas build` (profile), and whether store review is needed
5. **Runtime version note** — whether the runtime/fingerprint changed and why

## Quick Examples

- "Reworded the upgrade prompt and added a new Zod rule." → **OTA-safe.** `eas update`.
- "Added `expo-notifications` for daily practice reminders." → **Rebuild-and-resubmit**
  (new permission + native module).
- "Swapped the canvas stroke renderer for a native Skia surface." → **Rebuild-required**
  (new native module / config plugin).
- "Refactored `useCanvasAutosave` debounce logic." → **OTA-safe.**
- "Bumped Expo SDK to the next major." → **Rebuild-required** (runtime version changes;
  all installs need the new binary).
