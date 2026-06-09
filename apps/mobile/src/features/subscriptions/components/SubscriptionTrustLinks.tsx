import { Linking, Pressable, Text, View } from "react-native";

import { colors, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { SubscriptionTrustLinkUrls } from "../types";

interface SubscriptionTrustLinksProps {
  gradeBand: GradeBand;
  links: SubscriptionTrustLinkUrls;
}

export function SubscriptionTrustLinks({ gradeBand, links }: SubscriptionTrustLinksProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  const openUrl = (url: string) => {
    void Linking.openURL(url);
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.mutedText }]}>
        {t("subscriptions.trust.disclosure")}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
        <Pressable
          accessibilityHint={t("subscriptions.trust.termsHint")}
          accessibilityLabel={t("subscriptions.trust.termsAccessibility")}
          accessibilityRole="link"
          hitSlop={getAccessibleHitSlop(settings)}
          onPress={() => openUrl(links.termsUrl)}
        >
          <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: colors.text.link }]}>
            {t("subscriptions.trust.terms")}
          </Text>
        </Pressable>
        <Pressable
          accessibilityHint={t("subscriptions.trust.privacyHint")}
          accessibilityLabel={t("subscriptions.trust.privacyAccessibility")}
          accessibilityRole="link"
          hitSlop={getAccessibleHitSlop(settings)}
          onPress={() => openUrl(links.privacyUrl)}
        >
          <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: colors.text.link }]}>
            {t("subscriptions.trust.privacy")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
