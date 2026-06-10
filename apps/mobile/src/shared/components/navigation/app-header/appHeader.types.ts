import type { ComponentProps, ReactNode } from "react";
import type { ImageStyle, StyleProp, ViewStyle } from "react-native";
import type { Ionicons } from "@expo/vector-icons";

import type { GradeBand } from "@/design/tokens";
import type { TranslationKey, TranslationParams } from "@/i18n";

export type AppHeaderVariant =
  | "default"
  | "large"
  | "compact"
  | "centered"
  | "transparent"
  | "blurred"
  | "floating";

export type AppHeaderColorScheme = "light" | "dark";
export type AppHeaderIconName = ComponentProps<typeof Ionicons>["name"];

interface HeaderActionBase {
  accessibilityLabelKey?: TranslationKey;
  accessibilityLabelParams?: TranslationParams;
  accessibilityHintKey?: TranslationKey;
  accessibilityHintParams?: TranslationParams;
  disabled?: boolean;
  testID?: string;
}

type HeaderAvatarActionBase = HeaderActionBase & {
  type: "avatar";
  backgroundColor?: string;
  foregroundColor?: string;
  imageStyle?: StyleProp<ImageStyle>;
  onPress: () => void;
  accessibilityLabelKey: TranslationKey;
};

export type HeaderAction =
  | { type: "none" }
  | (HeaderActionBase & {
      type: "back";
      onPress?: () => void;
      accessibilityLabelKey: TranslationKey;
    })
  | (HeaderActionBase & {
      type: "close";
      onPress?: () => void;
      accessibilityLabelKey: TranslationKey;
    })
  | (HeaderActionBase & {
      type: "icon";
      icon: AppHeaderIconName;
      onPress: () => void;
      accessibilityLabelKey: TranslationKey;
    })
  | (HeaderAvatarActionBase & {
      fallbackText?: string;
      imageUri: string;
    })
  | (HeaderAvatarActionBase & {
      fallbackText: string;
      imageUri?: undefined;
    })
  | (HeaderActionBase & {
      type: "text";
      labelKey: TranslationKey;
      labelParams?: TranslationParams;
      onPress: () => void;
      accessibilityLabelKey: TranslationKey;
    });

export interface AppHeaderProgressConfig {
  value: number;
  labelKey: TranslationKey;
  labelParams?: TranslationParams;
  accessibilityLabelKey?: TranslationKey;
  accessibilityLabelParams?: TranslationParams;
  showValue?: boolean;
}

export interface AppHeaderProps {
  titleKey?: TranslationKey;
  titleParams?: TranslationParams;
  subtitleKey?: TranslationKey;
  subtitleParams?: TranslationParams;
  variant?: AppHeaderVariant;
  colorScheme?: AppHeaderColorScheme;
  gradeBand?: GradeBand;
  showSafeArea?: boolean;
  sticky?: boolean;
  leftAction?: HeaderAction;
  rightActions?: readonly HeaderAction[];
  progress?: AppHeaderProgressConfig;
  headerAccessory?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface AppHeaderResolvedColors {
  actionBackground: string;
  actionBorder: string;
  actionDisabledBackground: string;
  actionDisabledBorder: string;
  actionDisabledForeground: string;
  actionForeground: string;
  background: string;
  border: string;
  mutedText: string;
  progressBackground: string;
  progressFill: string;
  text: string;
}
