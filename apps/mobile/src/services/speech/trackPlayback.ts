/**
 * Local-clip playback for read-aloud, backed by react-native-track-player.
 *
 * Exposes one active SpeechPlaybackSession at a time: clips (WAV files) are
 * appended as synthesis finishes, so the first sentence starts playing while
 * later ones are still rendering. The module requires track-player lazily and
 * degrades to "unavailable" when the native module is not linked (Expo Go,
 * Jest), letting the read-aloud facade fall back to expo-speech.
 */
import type { EmitterSubscription } from "react-native";

type TrackPlayerModule = typeof import("react-native-track-player");

let trackPlayerModule: TrackPlayerModule | null | undefined;

function loadTrackPlayer(): TrackPlayerModule | null {
  if (trackPlayerModule !== undefined) {
    return trackPlayerModule;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    trackPlayerModule = require("react-native-track-player") as TrackPlayerModule;
  } catch {
    trackPlayerModule = null;
  }
  return trackPlayerModule;
}

/** True when the track-player native module is linked into this binary. */
export function isTrackPlayerAvailable(): boolean {
  return loadTrackPlayer() !== null;
}

let setupPromise: Promise<boolean> | null = null;

async function ensurePlayerReady(): Promise<boolean> {
  const tp = loadTrackPlayer();
  if (!tp) {
    return false;
  }

  if (!setupPromise) {
    setupPromise = (async () => {
      try {
        await tp.default.setupPlayer({
          autoHandleInterruptions: true,
          iosCategory: tp.IOSCategory.Playback,
          iosCategoryMode: tp.IOSCategoryMode.SpokenAudio,
          autoUpdateMetadata: true,
        });
      } catch (error) {
        // Re-running setup after a reload throws "player already initialized"
        // variants — the player is usable, so swallow only that class.
        const message = error instanceof Error ? error.message : String(error);
        if (!/already|initialized|Session ID/i.test(message)) {
          setupPromise = null;
          throw error;
        }
      }

      await tp.default.updateOptions({
        capabilities: [tp.Capability.Play, tp.Capability.Pause, tp.Capability.Stop],
        android: {
          appKilledPlaybackBehavior:
            tp.AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
        },
      });
      return true;
    })().catch((error) => {
      setupPromise = null;
      throw error;
    });
  }

  return setupPromise;
}

export interface SpeechPlaybackHandlers {
  onDone?: () => void;
  onError?: (error: unknown) => void;
}

export interface SpeechPlaybackSession {
  /** Append a synthesized WAV (plain path or file:// URI) to the queue. */
  addClip(wavPath: string): Promise<void>;
  /** Signal that no more clips are coming; onDone fires when the queue ends. */
  finalize(): void;
  /** Stop playback and release the queue. Safe to call repeatedly. */
  stop(): Promise<void>;
  readonly isActive: boolean;
}

let activeSession: SpeechPlaybackSession | null = null;

/** Whether a read-aloud playback session is currently active. */
export function isSpeechPlaybackActive(): boolean {
  return activeSession?.isActive ?? false;
}

/** Stop the active session, if any. */
export async function stopSpeechPlayback(): Promise<void> {
  await activeSession?.stop();
}

/**
 * Start a new playback session, stopping any previous one first. Returns
 * null when track-player is unavailable in this binary.
 */
export async function startSpeechPlayback(
  title: string,
  handlers: SpeechPlaybackHandlers = {},
): Promise<SpeechPlaybackSession | null> {
  const tp = loadTrackPlayer();
  if (!tp || !(await ensurePlayerReady().catch(() => false))) {
    return null;
  }

  await activeSession?.stop();

  const TrackPlayer = tp.default;
  await TrackPlayer.reset();

  let finalized = false;
  let ended = false;
  let queueDrained = false;
  let clipCount = 0;
  const subscriptions: EmitterSubscription[] = [];

  const cleanup = async () => {
    if (ended) {
      return;
    }
    ended = true;
    for (const subscription of subscriptions) {
      subscription.remove();
    }
    if (activeSession === session) {
      activeSession = null;
    }
    await TrackPlayer.reset().catch(() => {});
  };

  subscriptions.push(
    TrackPlayer.addEventListener(tp.Event.PlaybackQueueEnded, () => {
      if (finalized) {
        void cleanup().then(() => handlers.onDone?.());
      } else {
        // Synthesis is lagging behind playback; resume when the next clip lands.
        queueDrained = true;
      }
    }),
    TrackPlayer.addEventListener(tp.Event.PlaybackError, (event) => {
      void cleanup().then(() => handlers.onError?.(event));
    }),
  );

  const session: SpeechPlaybackSession = {
    get isActive() {
      return !ended;
    },

    async addClip(wavPath: string) {
      if (ended) {
        return;
      }
      const url = wavPath.startsWith("file://") ? wavPath : `file://${wavPath}`;
      await TrackPlayer.add([{ url, title }]);
      clipCount += 1;

      if (clipCount === 1) {
        await TrackPlayer.play();
      } else if (queueDrained) {
        queueDrained = false;
        const queue = await TrackPlayer.getQueue();
        await TrackPlayer.skip(queue.length - 1);
        await TrackPlayer.play();
      }
    },

    finalize() {
      finalized = true;
      // Everything already played before finalize() was called.
      if (queueDrained && !ended) {
        void cleanup().then(() => handlers.onDone?.());
      }
    },

    async stop() {
      if (ended) {
        return;
      }
      await cleanup();
    },
  };

  activeSession = session;
  return session;
}
