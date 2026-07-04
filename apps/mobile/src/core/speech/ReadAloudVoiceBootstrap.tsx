import { useEffect } from "react";

import { prepareOnDeviceReadAloudVoice } from "@/services/speech/readAloudService";

/**
 * Kick off the on-device read-aloud voice download right after first app
 * launch, so the voice is ready before a student's first read-aloud tap.
 *
 * Deferred a few seconds to keep the cold-start path (fonts, auth, first
 * render) uncontended; the heavy work is native download + extraction.
 * Idempotent: resolves immediately when the voice is already installed,
 * concurrent calls share one download, and it no-ops in binaries without the
 * native modules (Expo Go, tests).
 */
const STARTUP_DELAY_MS = 3000;

export function ReadAloudVoiceBootstrap() {
  useEffect(() => {
    const timer = setTimeout(() => {
      void prepareOnDeviceReadAloudVoice();
    }, STARTUP_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
