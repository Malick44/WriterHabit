import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from "@expo-google-fonts/hanken-grotesk";
import {
  Newsreader_400Regular,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { AppProviders } from "@/core/providers/AppProviders";
import { shouldHideDevTools } from "@/core/config/devtoolsConfig";
import { ThemeTuningPanel } from "@/devtools/theme-tuner";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(student)" />
        <Stack.Screen name="(parent)" />
        <Stack.Screen name="(teacher)" />
        <Stack.Screen name="paywall" />
      </Stack>
      {__DEV__ && !shouldHideDevTools ? <ThemeTuningPanel /> : null}
    </AppProviders>
  );
}
