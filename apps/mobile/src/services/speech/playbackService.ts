/**
 * react-native-track-player headless playback service.
 *
 * Runs in a SEPARATE JavaScript context from the app — no React, no stores.
 * Registered from the root index.js entry. WriterHabit only plays short
 * read-aloud clips, so the surface is the minimal remote-control set.
 */
import TrackPlayer, { Event } from "react-native-track-player";

export async function playbackService(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    void TrackPlayer.play();
  });
  TrackPlayer.addEventListener(Event.RemotePause, () => {
    void TrackPlayer.pause();
  });
  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    void TrackPlayer.stop();
  });
}
