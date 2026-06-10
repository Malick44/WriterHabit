import { memo } from "react";
import { Text, View } from "react-native";

import { typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

import { APP_HEADER_TEST_IDS } from "./appHeader.constants";
import { styles } from "./appHeader.styles";
import type { AppHeaderProgressConfig, AppHeaderResolvedColors } from "./appHeader.types";

interface AppHeaderProgressProps {
  colors: AppHeaderResolvedColors;
  config: AppHeaderProgressConfig;
  gradeBand: GradeBand;
}

function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export const AppHeaderProgress = memo(function AppHeaderProgress({
  colors: headerColors,
  config,
  gradeBand,
}: AppHeaderProgressProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const progress = clampProgress(config.value);
  const percent = Math.round(progress * 100);
  const label = t(config.labelKey, config.labelParams);
  const accessibilityLabel = config.accessibilityLabelKey
    ? t(config.accessibilityLabelKey, config.accessibilityLabelParams)
    : label;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={styles.progressContainer}
      testID={APP_HEADER_TEST_IDS.progress}
    >
      {config.showValue ? (
        <View style={styles.progressMeta}>
          <Text
            numberOfLines={1}
            style={[getAccessibleTextStyle(type.caption, settings), { color: headerColors.mutedText }]}
          >
            {label}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              getAccessibleTextStyle(type.caption, settings),
              {
                color: headerColors.text,
                fontVariant: ["tabular-nums"],
              },
            ]}
          >
            {percent}%
          </Text>
        </View>
      ) : null}

      <View style={[styles.progressTrack, { backgroundColor: headerColors.progressBackground }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: headerColors.progressFill,
              width: `${percent}%`,
            },
          ]}
        />
      </View>
    </View>
  );
});
