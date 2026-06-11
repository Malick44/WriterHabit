import { Stack } from "expo-router";
import { AppProviders } from "@/core/providers/AppProviders";
import { shouldHideDevTools } from "@/core/config/devtoolsConfig";
import { ThemeTuningPanel } from "@/devtools/theme-tuner";

export default function RootLayout() {
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
