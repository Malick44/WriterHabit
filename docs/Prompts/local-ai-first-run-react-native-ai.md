Implement the On-First-Run Local AI setup flow for WriteWise using React Native AI from Callstack.

Goal:
Add an optional first-run Local AI capability gate that checks the device profile before offering any model download. Local AI is a latency/cost optimization for small, low-risk writing-coach helpers only. The flow must keep WriteWise usable on every device by always preserving cloud fallback and a Later path, and it must never weaken WriteWise's child-safety, moderation, or academic-integrity guarantees.

Repository context:
- This is a Grades 1–12 student writing-assistant. Read README.md and docs/06_AI_COACH_ARCHITECTURE.md and docs/10_SECURITY_PRIVACY.md before coding. The AI is a coach, not a ghostwriter.
- For memory-sensitive work, use the mobile memory guard guidance at skills/mobile-memory-guard/SKILL.md.
- For deployment classification, use skills/expo-ota-vs-rebuild/SKILL.md. This feature is native-build work, not OTA-only.
- Follow the feature-based architecture in docs/01_FEATURE_BASED_ARCHITECTURE.md and the module template in docs/11_FEATURE_MODULE_TEMPLATE.md: route files stay thin and re-export feature screens; screens consume hooks only; native/provider logic stays in services.
- The AI coach already lives at apps/mobile/src/features/ai-coach/ (api/aiCoachApi.ts, hooks/useAiCoach.ts, services/, prompts/, types.ts). Local AI must plug into the existing coach contracts (AiCoachContext / AiCoachResponse), not bypass them.

NON-NEGOTIABLE child-safety guardrails (read first):
- Server-side moderation and academic-integrity checks are mandatory for every coaching response shown to a student (docs/06, docs/10). On-device generation must NOT be used to skip input/output moderation.
- When the device is offline, the coach degrades to non-generative helpers (saved tips, rubric checklists, sentence-completeness prompts) — it does NOT free-generate unmoderated text to a child. Free-form local generation is only allowed when the moderation/integrity policy can still be applied (online, or via an on-device safety check that mirrors the server policy).
- Local AI is parent-controllable: parents can disable AI coach access (docs/10). Respect that flag before offering or running local AI.
- Never store student writing or model payloads in React state or in persisted setup state. Persist only setup decisions and model IDs.

Source package context:
- React Native AI repo: https://github.com/callstackincubator/ai
- Provider packages are Vercel AI SDK compatible.
- React Native AI 0.12+ maps to Vercel AI SDK v6; 0.11 and below maps to AI SDK v5.
- Confirm package names and current install guidance from the Callstack repo/docs before installing.
- Assume New Architecture/Fabric is required.

Provider strategy:
1. Apple provider first on eligible iOS devices.
   - Package: @react-native-ai/apple.
   - Use only where platform and OS/device capability support the requested task. No first-run model download needed.
   - Text generation requires iOS 26+ and an Apple Intelligence-capable device. Embeddings on iOS 17+.

2. Llama/GGUF as the primary downloaded local model path.
   - Packages: @react-native-ai/llama, llama.rn, react-native-blob-util.
   - Android-first and cross-platform local path.
   - Use GGUF model IDs in the format owner/repo/filename.gguf.
   - Use model file helpers when available: downloadModel, isModelDownloaded, getModelPath, getDownloadedModels, removeModel.
   - Prefer a small Qwen/SmolLM-class model before any 3B+ model — WriteWise local tasks are short helpers, not long generation.

3. MLC as an optional high-capability tier only.
   - Package: @react-native-ai/mlc.
   - Not the default first-run path. Heavier (≈1GB–4.5GB). iOS requires the increased memory limit capability.
   - If MLC is not implemented in this pass, leave a typed provider slot and a clear TODO in the service layer, not in UI.

Architecture requirements:
Create or update these boundaries (feature-based, matching this repo):

apps/mobile/src/features/ai-coach/services/
- localAi/types.ts
- localAi/deviceProfile.ts
- localAi/modelCatalog.ts
- localAi/reactNativeAiEngine.ts
- localAi/aiSetupRepository.ts

apps/mobile/src/features/ai-setup/
- api/aiSetupApi.ts            (TanStack Query hooks/mutations only)
- stores/aiSetupStore.ts       (Zustand wizard-local UI state only)
- screens/FirstRunAiSetupScreen.tsx
- index.ts, types.ts

Responsibilities:
- localAi/types.ts: provider IDs, model IDs, device profile shape, setup state, readiness state, download progress, and the allowed local task types.
- localAi/deviceProfile.ts: probe platform, OS version, free disk, memory tier (if available), low power mode (if available), network type (if available), emulator state (if available), and runtime support.
- localAi/modelCatalog.ts: the approved WriteWise model tiers with estimated disk/memory budgets.
- localAi/reactNativeAiEngine.ts: adapt Apple, Llama/GGUF, and optional MLC behind one typed interface.
- localAi/aiSetupRepository.ts: persisted setup state (AsyncStorage/SecureStore), installed-model checks, provider readiness, download, prepare, unload, remove.
- ai-setup/api/aiSetupApi.ts: TanStack Query hooks and mutations only.
- ai-setup/stores/aiSetupStore.ts: wizard-local UI state only — never model payloads or student text.
- FirstRunAiSetupScreen.tsx: pure screen composition consuming hooks; must not call provider APIs directly. The matching route file under apps/mobile/app/ just re-exports it.

Device profile gates:
Implement a conservative decision matrix:
- appleSystem: eligible iOS device; no model download; prepare lazily on first AI action.
- localLite: enough storage and memory for a small GGUF model; offer this before larger models.
- localFull: high-memory, high-storage device; offer a larger small-class GGUF or optional MLC only with explicit consent.
- cloudOnly: unsupported runtime, low storage, low memory, parent-disabled AI, or declined download; route AI tasks to the WriteWise cloud API.
- deferred: user taps Later; keep cloud as default and expose setup from profile-settings.

Do not auto-download models on first launch. Always ask for explicit consent and show approximate model size, available storage, Wi-Fi recommendation, and fallback behavior. For younger students, gate consent behind the parent/guardian where required.

Runtime lifecycle requirements:
- Download only after explicit consent.
- Show real progress from the provider; handle NaN/undefined/missing percentages defensively.
- Call prepare only when the user intends to use local AI soon; otherwise defer to first use.
- Call unload after long jobs, screen exit, app background, or when switching models.
- Keep only one local model prepared at a time. Do not keep a resident local LLM alongside other heavy native resources unless the device is clearly high tier.
- Provide removal support via removeModel / provider-specific APIs from profile-settings.
- Persist only setup decisions and model IDs — never model payloads or student writing.

Initial product scope (allowed local tasks):
Use local AI only for small, low-risk coaching helpers, and always within the academic-integrity policy:
- grammar / punctuation explanation
- "suggest a stronger word" for a selected word
- sentence-completeness / clarity check on a single sentence
- one brainstorming starter question
- short hint generation

Keep these cloud-first through the WriteWise API and never local-only:
- full rubric review and feedback summary
- anything that could approach rewriting a whole response
- any task for a student whose parent has restricted AI access
All local output still flows through the coach's safety/integrity layer before display.

UI requirements:
- The first-run setup screen is optional and must not block the core app.
- Include Download, Use cloud, and Later actions.
- Show a calm, age-appropriate explanation: privacy, offline availability, model size, and battery/storage impact.
- Use design tokens from apps/mobile/src/design/tokens/ (colors, spacing, radius, motion). No raw hex, arbitrary spacing, or custom motion constants.
- Follow the project's localization approach in `apps/mobile/src/shared/i18n/`; no raw user-facing strings in JSX.
- Use staged real progress, not fake timers.
- Include loading, error, unsupported, low-storage, parent-restricted, and completed states.
- Touch targets at least 44px (larger for younger grades).

Data-layer requirements:
- TanStack Query for device profile, AI readiness, installed-model checks, downloads, and removal mutations.
- Zustand only for local wizard/client state.
- Keep UI components pure: props in, callbacks out.
- Keep provider and native module imports outside screens; isolate them behind the localAi service adapters.

Suggested implementation sequence:
1. Confirm package versions and AI SDK compatibility from the Callstack repo/docs. Decide whether this pass installs Apple + Llama only, or also MLC.
2. Add native dependencies; treat as native rebuild required.
3. Add the localAi service layer (types, model catalog, device profile probing, provider adapter, setup repository) with bounded model selection and cleanup.
4. Add the query + state layer: useDeviceAiProfileQuery, useAiReadinessQuery, useEnsureLocalAiModelMutation, useRemoveLocalAiModelMutation, and small routing helpers; plus a small Zustand store for wizard choices only.
5. Add the UI flow: FirstRunAiSetupScreen, wired into onboarding/first-run routing without blocking core app usage, plus a profile-settings entry to revisit setup and remove models.
6. Add task routing: a local/cloud routing abstraction for the allowed small tasks, respecting parent AI restrictions and the moderation/integrity policy; keep full review cloud-first.
7. Validate native and runtime behavior:
   - npm run typecheck (tsc --noEmit) and npm run lint in apps/mobile.
   - npx expo run:android on a real device/emulator; cold-launch and filter logcat for FATAL EXCEPTION, AndroidRuntime, ReactNativeJS, ClassNotFoundException, UnsatisfiedLinkError, OutOfMemoryError, and provider-specific native errors.
   - If iOS changes are made, validate with a dev build and document any Xcode capability changes (e.g. increased memory limit).

Acceptance criteria:
- First-run Local AI setup appears only when the user has not completed or deferred setup, and AI access is not parent-restricted.
- Device profile is checked before any model is offered.
- Unsupported, low-resource, or parent-restricted devices get cloud-first UX without errors.
- Downloads require explicit consent and show real progress.
- Downloaded model state persists across app restarts.
- Local model can be unloaded and removed.
- Screens do not import provider packages directly.
- No student writing or model payloads are stored in React state or persisted setup state.
- Small coaching tasks route through local AI only when readiness is confirmed and the safety/integrity policy is satisfied.
- Cloud fallback works when local AI is unavailable, declined, offline, or fails.
- App starts cleanly after a native rebuild.

Memory impact report required in final response (per skills/mobile-memory-guard/SKILL.md):
- Hotspots considered, leak risks checked, decisions made, concrete fixes implemented, remaining tradeoffs, OTA vs rebuild impact.

Prebuild and native-change reporting required in final response (per skills/expo-ota-vs-rebuild/SKILL.md):
- Which files are generated by Expo and at risk during prebuild.
- Which changes are stable across prebuild.
- Whether a clean prebuild is required.
- What breaks if native dependencies are added without rebuilding the dev app.
