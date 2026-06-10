import { Stack } from "expo-router";
import { AppProviders } from "@/core/providers/AppProviders";
import { ThemeTuningPanel } from "@/shared/components/layout";

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
      {__DEV__ && <ThemeTuningPanel />}
    </AppProviders>
  );
}
