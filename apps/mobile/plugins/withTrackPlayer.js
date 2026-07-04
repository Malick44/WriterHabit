/**
 * Registers react-native-track-player's Android MusicService in the manifest
 * with the mediaPlayback foreground-service type (required on Android 14+).
 * Ported from the VoiceReader reference integration.
 */
const { withAndroidManifest } = require("@expo/config-plugins");

const SERVICE_NAME = "com.doublesymmetry.trackplayer.service.MusicService";

const withTrackPlayer = (config) => {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (!application) {
      return config;
    }

    application.service = application.service ?? [];
    const alreadyDeclared = application.service.some(
      (service) => service.$ && service.$["android:name"] === SERVICE_NAME,
    );
    if (!alreadyDeclared) {
      application.service.push({
        $: {
          "android:name": SERVICE_NAME,
          "android:enabled": "true",
          "android:exported": "true",
          "android:foregroundServiceType": "mediaPlayback",
        },
        "intent-filter": [
          {
            action: [
              { $: { "android:name": "android.media.browse.MediaBrowserService" } },
            ],
          },
        ],
      });
    }

    return config;
  });
};

module.exports = withTrackPlayer;
