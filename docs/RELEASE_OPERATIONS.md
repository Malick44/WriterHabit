# Release Operations

Status: Mobile EAS/OTA/CI release surface added on 2026-06-11. Public release is still blocked until the Expo project owner links the real EAS project id and configures native store credentials.

## Mobile Project Root

Run Expo and EAS commands from `apps/mobile/`.

The EAS config is intentionally app-local:

```bash
cd apps/mobile
npx eas-cli@latest config
```

## Required Owner Action

The committed app config contains the placeholder `WRITEWISE_EAS_PROJECT_ID_REQUIRED` because `npx eas-cli@latest init --non-interactive` could not choose between the available Expo owners (`malickb` and `ai-orbit-studio`) without an owner decision.

The owner must choose the Expo account or organization, then run:

```bash
cd apps/mobile
npx eas-cli@latest init --force
npx eas-cli@latest update:configure --non-interactive
npx eas-cli@latest config
```

After `init` and `update:configure`, commit the real `extra.eas.projectId` and matching `updates.url` in `apps/mobile/app.json`. The project id is public configuration, not a secret.

Until that is done, PR CI still runs, OTA/build jobs skip safely, and push token registration skips because the app only accepts UUID-shaped EAS project ids from `Constants.easConfig?.projectId` or `Constants.expoConfig?.extra?.eas?.projectId`.

## Runtime And Channels

`apps/mobile/app.json` uses:

- `runtimeVersion.policy: "fingerprint"` so OTA compatibility changes when native dependencies, config plugins, or native config change.
- `updates.url: "https://u.expo.dev/<project-id>"` after owner linking.
- `updates.checkAutomatically: "ON_LOAD"` and `fallbackToCacheTimeout: 0` so production builds check promptly without delaying launch.

`apps/mobile/eas.json` defines:

- `development` channel/profile for internal dev-client builds.
- `preview` channel/profile for internal release-candidate installs.
- `production` channel/profile for App Store and Play Store binaries.

## GitHub Actions

`.github/workflows/mobile-release.yml` runs on mobile/shared release-surface changes:

```bash
cd apps/mobile
npm ci
npx expo install --check
npm run typecheck
npm run lint -- --max-warnings=0
npm test -- --runInBand
npx expo-doctor
npx expo export --platform ios --output-dir /tmp/writewise-release-ios
npx expo export --platform android --output-dir /tmp/writewise-release-android
```

Manual EAS update/build steps are gated behind:

- GitHub secret `EXPO_TOKEN`.
- A real committed EAS project id or repository variable `WRITEWISE_EAS_PROJECT_ID`.
- Manual workflow-dispatch inputs.

Do not store Apple, Google, APNs, FCM, service-role, or Expo tokens in the repository. Use EAS managed credentials and GitHub secrets/variables.

## EAS Workflow

`apps/mobile/.eas/workflows/release.yml` provides a manual EAS-hosted workflow for release builds and optional OTA publishing after the project is linked to EAS.

Use it only after the owner action above is complete and the Expo GitHub integration is connected to the repository.

## Release Commands

Preview build:

```bash
cd apps/mobile
npx eas-cli@latest build --profile preview --platform all
```

Production build:

```bash
cd apps/mobile
npx eas-cli@latest build --profile production --platform all
```

Production OTA update for JS-only changes:

```bash
cd apps/mobile
npx eas-cli@latest update --branch production --platform all --message "WriteWise production update"
```

Any dependency, native module, config plugin, app config, permission, entitlement, bundle id, icon, splash, EAS project identity, OTA URL, or push-notification capability change requires a new native build before users can receive it safely.
