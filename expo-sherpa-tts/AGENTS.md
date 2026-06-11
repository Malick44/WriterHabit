# WriterHabit Audio — offline sherpa-tts Native Module (packages/expo-sherpa-tts)

This package is the design contract for a custom Expo native module that would wrap the **next-gen sherpa-onnx** offline TTS engine. Any future implementation under `/packages/expo-sherpa-tts/` must adhere strictly to these native implementation, memory, lifecycle, and API constraints.

---

## 0. Status — Not Built (Reuse Decision)
**This package is currently an unimplemented stub (this `AGENTS.md` is its only file).** We deliberately did **not** build a custom native module. Offline TTS instead ships by **reusing the community `react-native-sherpa-onnx` package**, consumed only through the app-side facade at `apps/mobile/src/services/tts/` (feature code depends on that facade, never on the native package directly).

Treat everything below (§1–§7) as the contract to honor **only if** we later decide to replace the reused package with a first-party module. Until then, the memory, lifecycle, and cancellation policies described here are realized in the facade and its sherpa adapter under `apps/mobile/src/services/tts/sherpa/`, not in this package.

---

## 1. Package Purpose & Scope
A first-party module here would provide low-latency, offline synthesis utilizing ONNX models directly on the client device, bypassing network requirements for a reliable offline reading-listening experience. This need is presently met by the reused `react-native-sherpa-onnx` package (see §0).

---

## 2. Required public TypeScript API
The native module must export exactly the following TypeScript interface. All native layer communications (JSI/Expo Modules API) must conform to this schema:

```typescript
export interface SherpaConfig {
  modelPath: string;      // Absolute path to the .onnx model
  lexiconPath: string;    // Path to pronunciation lexicon files
  tokensPath: string;     // Path to token configuration
  voiceId?: string;       // Optional specific voice/speaker identifier
  numThreads?: number;    // Thread pool count (default: 4)
  sampleRate?: number;    // Audio sample rate (default: 16000)
}

export interface SynthesisRequest {
  jobId: string;          // Unique tracker identifier for cancellation
  text: string;           // Text chunk to synthesize
  outputPath: string;     // File path where the resulting .wav should be saved
  speed?: number;         // Playback velocity multiplier (0.5 to 2.0)
  speakerId?: number;     // Multi-speaker model voice selection index
}

export interface RuntimeInfo {
  isModelLoaded: boolean;
  activeVoiceId: string | null;
  memoryUsageBytes: number;
  threadsInUse: number;
}

// Canonical Service Interface
export interface ExpoSherpaTtsModule {
  loadModel(config: SherpaConfig): Promise<boolean>;
  synthesizeToFile(request: SynthesisRequest): Promise<{ success: boolean; durationSeconds: number }>;
  cancel(jobId: string): Promise<boolean>;
  getRuntimeInfo(): Promise<RuntimeInfo>;
  release(): Promise<boolean>;
}
```

---

## 3. Native Layer Architecture Rules

### Android/Kotlin Rules
* **Thread Safety**: Never execute synthesis on the main UI thread. Leverage Kotlin Coroutines and dispatch task queues on `Dispatchers.Default` or a dedicated low-priority executor thread.
* **NDK Crash Safety**: Enclose JNI methods in try-catch structures. Ensure native memory pointers are nullified upon release to prevent JVM-level segmentation faults.
* **Logging**: Output clean log streams prefixed with `[SherpaTTS-Android]`. Avoid writing sensitive text chunks into system logs.

### iOS/Swift Rules
* **Background Queues**: Direct all synthesis heavy-lifting to a background Grand Central Dispatch (GCD) serial queue (e.g. `qos: .userInitiated`).
* **Memory ARC Integration**: Use Swift `autoreleasepool` scopes inside synthesis processing loops to release heavy visual/audio buffers immediately.
* **Audio Sessions**: Respect ambient iOS system audio rules. Coordinate with Expo AV interfaces to prevent blocking phone calls or navigation directions.

---

## 4. Model Storage & Voice Pack Lifecycle
* **Offline Path Resolution**: All models are saved under the application cache directory or custom storage locations. Do not bundle raw 120MB+ model files inside the main app bundle.
* **Asset Verification**: Before calling `loadModel`, double-check the existence and sizes of all model configuration files (`.onnx`, `lexicon.txt`, `tokens.txt`).

---

## 5. Performance, Memory & Cancellation Policies
* **Instant Termination**: Tapping pause/skip or changing screens must trigger `cancel(jobId)`. The native layer must evaluate an atomic cancellation flag on *every* sentence boundaries loop iteration and stop execution within **`100ms`** of command arrival, releasing the output file descriptor.
* **Memory Cap**: Idle native memory footprint must remain under **`15MB`**. Memory during peak synthesis must not exceed **`80MB`**. Perform full GC and release native resources on call to `release()`.

---

## 6. Typed Native Error Matrix
To ensure graceful user recovery in the UI, map native failure states into typed JS exceptions:
* `SHERPA_ERR_MODEL_NOT_LOADED`: Tried to synthesize without loading model first.
* `SHERPA_ERR_FILE_NOT_FOUND`: Specified model path, lexicon, or output folder is invalid.
* `SHERPA_ERR_NATIVE_CRASH`: The underlying ONNX Runtime triggered a core execution failure.
* `SHERPA_ERR_DISK_FULL`: Cannot write audio buffer because disk space is exhausted.

---

## 7. Testing & QA Checklist
* [ ] **Compilation**: Kotlin and Swift code compile with zero warnings in strict native modes.
* [ ] **Cancellation Check**: Verifiably interrupts synthesis in under `100ms` without holding file locks.
* [ ] **Memory Integrity**: Run profile/leak tools to guarantee memory returns to baseline after `release()`.
* [ ] **Thread Behavior**: Confirm zero blocking frames occur on the React Native JS UI thread.
