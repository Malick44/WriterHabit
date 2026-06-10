import type { ComponentProps } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import type { Ionicons } from "@expo/vector-icons";

import type { TranslationKey, TranslationParams } from "@/i18n";

export type TopAlertType = "success" | "error" | "warning" | "info" | "neutral" | "offline" | "loading";
export type TopAlertVariant = "compact" | "expanded";
export type TopAlertColorScheme = "light" | "dark";
export type TopAlertDismissReason = "action" | "auto" | "close" | "manager" | "swipe" | "tap";

export interface TopAlertRequest {
  id?: string;
  type?: TopAlertType;
  variant?: TopAlertVariant;
  colorScheme?: TopAlertColorScheme;
  titleKey?: TranslationKey;
  titleParams?: TranslationParams;
  descriptionKey?: TranslationKey;
  descriptionParams?: TranslationParams;
  accessibilityLabelKey?: TranslationKey;
  accessibilityLabelParams?: TranslationParams;
  actionLabelKey?: TranslationKey;
  actionLabelParams?: TranslationParams;
  actionAccessibilityLabelKey?: TranslationKey;
  actionAccessibilityHintKey?: TranslationKey;
  closeAccessibilityLabelKey?: TranslationKey;
  closeAccessibilityHintKey?: TranslationKey;
  iconName?: ComponentProps<typeof Ionicons>["name"];
  showIcon?: boolean;
  showCloseButton?: boolean;
  tapToDismiss?: boolean;
  autoDismissMs?: number | null;
  dedupeKey?: string;
  dedupeWindowMs?: number;
  onActionPress?: () => void | Promise<void>;
  onDismiss?: (reason: TopAlertDismissReason) => void;
  style?: StyleProp<ViewStyle>;
}

export type TopAlertEntry = TopAlertRequest & {
  id: string;
  createdAt: number;
  type: TopAlertType;
  variant: TopAlertVariant;
};

export interface TopAlertApi {
  show: (alert: TopAlertRequest) => string | null;
  hide: (id?: string, reason?: TopAlertDismissReason) => void;
  hideAll: (reason?: TopAlertDismissReason) => void;
}

export interface TopAlertQueueSnapshot {
  active: TopAlertEntry | null;
  queued: readonly TopAlertEntry[];
}
