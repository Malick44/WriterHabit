import type { ComponentProps, ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import type { Ionicons } from "@expo/vector-icons";

import type { GradeBand } from "@/design/tokens";
import type { TranslationKey, TranslationParams } from "@/i18n";
import type { ButtonVariant } from "@/shared/components/buttons";

export type ModalMode = "dialog" | "bottomSheet" | "fullScreen";
export type ModalColorScheme = "light" | "dark";

export type ModalCloseReason =
  | "action"
  | "backdrop"
  | "closeButton"
  | "hardwareBack"
  | "programmatic"
  | "swipe";

export type ModalRenderContent = () => ReactNode;

export interface LocalizedModalText {
  key: TranslationKey;
  params?: TranslationParams;
}

export interface ModalAction {
  id: string;
  labelKey: TranslationKey;
  labelParams?: TranslationParams;
  accessibilityLabelKey?: TranslationKey;
  accessibilityHintKey?: TranslationKey;
  iconName?: ComponentProps<typeof Ionicons>["name"];
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  closeOnPress?: boolean;
  onPress?: () => boolean | void | Promise<boolean | void>;
}

export interface ModalProps {
  visible: boolean;
  titleKey?: TranslationKey;
  titleParams?: TranslationParams;
  subtitleKey?: TranslationKey;
  subtitleParams?: TranslationParams;
  accessibilityLabelKey?: TranslationKey;
  accessibilityLabelParams?: TranslationParams;
  closeAccessibilityLabelKey?: TranslationKey;
  closeAccessibilityHintKey?: TranslationKey;
  mode?: ModalMode;
  colorScheme?: ModalColorScheme;
  fullScreen?: boolean;
  bottomSheet?: boolean;
  backdropOpacity?: number;
  dismissible?: boolean;
  closeOnBackdropPress?: boolean;
  enableSwipeToDismiss?: boolean;
  showCloseButton?: boolean;
  avoidKeyboard?: boolean;
  gradeBand?: GradeBand;
  headerActions?: ReactNode;
  footer?: ReactNode;
  actions?: readonly ModalAction[];
  children?: ReactNode | ModalRenderContent;
  renderContent?: ModalRenderContent;
  contentContainerStyle?: StyleProp<ViewStyle>;
  panelStyle?: StyleProp<ViewStyle>;
  testID?: string;
  onClose: (reason: ModalCloseReason) => void;
  onAfterClose?: () => void;
  onDismissBlocked?: (reason: ModalCloseReason) => void;
}

export type ManagedModalOptions = Omit<ModalProps, "visible" | "onClose" | "onAfterClose"> & {
  id?: string;
};

export type ManagedModalEntry = ManagedModalOptions & {
  id: string;
  visible: boolean;
};

export interface AlertModalOptions {
  id?: string;
  titleKey: TranslationKey;
  titleParams?: TranslationParams;
  subtitleKey?: TranslationKey;
  subtitleParams?: TranslationParams;
  confirmLabelKey?: TranslationKey;
  confirmAccessibilityLabelKey?: TranslationKey;
  gradeBand?: GradeBand;
  mode?: ModalMode;
  dismissible?: boolean;
  renderContent?: ModalRenderContent;
}

export interface ConfirmationModalOptions {
  id?: string;
  titleKey: TranslationKey;
  titleParams?: TranslationParams;
  subtitleKey?: TranslationKey;
  subtitleParams?: TranslationParams;
  confirmLabelKey?: TranslationKey;
  confirmAccessibilityLabelKey?: TranslationKey;
  cancelLabelKey?: TranslationKey;
  cancelAccessibilityLabelKey?: TranslationKey;
  destructive?: boolean;
  gradeBand?: GradeBand;
  mode?: ModalMode;
  dismissible?: boolean;
  renderContent?: ModalRenderContent;
}

export interface ModalApi {
  show: (options: ManagedModalOptions) => string;
  bottomSheet: (options: ManagedModalOptions) => string;
  dismiss: (id?: string, reason?: ModalCloseReason) => void;
  dismissAll: (reason?: ModalCloseReason) => void;
  alert: (options: AlertModalOptions) => Promise<void>;
  confirm: (options: ConfirmationModalOptions) => Promise<boolean>;
}
