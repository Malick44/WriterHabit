import type { ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { spacing } from "@/design/tokens";
import type { TranslationKey } from "@/i18n";
import { AppHeader } from "@/shared/components";

import { grade3Theme } from "../theme/grade3Theme";
import { Grade3Screen } from "./Grade3Screen";

/** Dashboard-style shell: fixed compact header above the scrolling content. */
export function Grade3AdventureShell({
  children,
  subtitle,
  titleKey,
}: {
  children: ReactNode;
  subtitle?: string;
  titleKey: TranslationKey;
}) {
  return (
    <View style={{ backgroundColor: grade3Theme.screen.background, flex: 1 }}>
      <SafeAreaView edges={["top"]}>
        <AppHeader
          gradeBand="elementary"
          leftAction={{ accessibilityLabelKey: "common.back", type: "back" }}
          showSafeArea={false}
          style={{ backgroundColor: grade3Theme.screen.background }}
          titleKey={titleKey}
          variant="compact"
        />
      </SafeAreaView>
      <Grade3Screen contentPaddingTop={spacing.md} subtitle={subtitle}>
        {children}
      </Grade3Screen>
    </View>
  );
}
