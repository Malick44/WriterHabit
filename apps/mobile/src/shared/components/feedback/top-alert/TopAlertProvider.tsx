import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing } from "@/design/tokens";
import { useI18n } from "@/i18n";

import { TopAlertBanner, type TopAlertBannerPalette } from "./TopAlertBanner";
import { TopAlertContext } from "./TopAlertContext";
import { topAlertManager } from "./topAlertManager";
import { TopAlertQueue } from "./topAlertQueue";
import { TOP_ALERT_DEFAULT_AUTO_DISMISS_MS, TOP_ALERT_TEST_IDS } from "./topAlert.constants";
import { getTopAlertVariantStyle } from "./topAlert.styles";
import type { TopAlertApi, TopAlertDismissReason, TopAlertEntry, TopAlertRequest } from "./topAlert.types";

function getAutoDismissMs(alert: TopAlertEntry): number | null {
  if (alert.autoDismissMs === null) {
    return null;
  }

  if (alert.autoDismissMs !== undefined) {
    return alert.autoDismissMs;
  }

  return alert.type === "loading" || alert.type === "offline" ? null : TOP_ALERT_DEFAULT_AUTO_DISMISS_MS;
}

export function TopAlertProvider({ children }: PropsWithChildren) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const queueRef = useRef(new TopAlertQueue());
  const [activeAlert, setActiveAlert] = useState<TopAlertEntry | null>(null);

  const syncSnapshot = useCallback(() => {
    setActiveAlert(queueRef.current.snapshot().active);
  }, []);

  const show = useCallback(
    (alert: TopAlertRequest) => {
      const entry = queueRef.current.enqueue(alert);
      syncSnapshot();

      return entry?.id ?? null;
    },
    [syncSnapshot],
  );

  const hide = useCallback(
    (id?: string, reason: TopAlertDismissReason = "manager") => {
      const current = queueRef.current.snapshot().active;
      queueRef.current.notifyDismissed(current && (!id || current.id === id) ? current : null, reason);
      queueRef.current.dismiss(id);
      syncSnapshot();
    },
    [syncSnapshot],
  );

  const hideAll = useCallback(
    (reason: TopAlertDismissReason = "manager") => {
      const current = queueRef.current.snapshot().active;
      queueRef.current.notifyDismissed(current, reason);
      queueRef.current.clear();
      syncSnapshot();
    },
    [syncSnapshot],
  );

  const api = useMemo<TopAlertApi>(
    () => ({
      hide,
      hideAll,
      show,
    }),
    [hide, hideAll, show],
  );

  useEffect(() => topAlertManager.register(api), [api]);

  // Auto-dismiss is owned by the provider so that close/action/auto stay distinguishable
  // through the queue's onDismiss reason (the prop-driven banner only exposes a single callback).
  useEffect(() => {
    if (!activeAlert) {
      return undefined;
    }

    const autoDismissMs = getAutoDismissMs(activeAlert);

    if (!autoDismissMs) {
      return undefined;
    }

    const timer = setTimeout(() => hide(activeAlert.id, "auto"), autoDismissMs);

    return () => clearTimeout(timer);
  }, [activeAlert, hide]);

  return (
    <TopAlertContext.Provider value={api}>
      {children}
      {activeAlert ? <ActiveTopAlert alert={activeAlert} hide={hide} insetTop={insets.top} key={activeAlert.id} t={t} /> : null}
    </TopAlertContext.Provider>
  );
}

interface ActiveTopAlertProps {
  alert: TopAlertEntry;
  hide: (id?: string, reason?: TopAlertDismissReason) => void;
  insetTop: number;
  t: ReturnType<typeof useI18n>["t"];
}

function ActiveTopAlert({ alert, hide, insetTop, t }: ActiveTopAlertProps) {
  const variantStyle = useMemo(
    () => getTopAlertVariantStyle(alert.type, alert.colorScheme ?? "light"),
    [alert.colorScheme, alert.type],
  );

  const palette = useMemo<TopAlertBannerPalette>(
    () => ({
      surface: variantStyle.background,
      text: variantStyle.foreground,
      textMuted: variantStyle.mutedForeground,
      accent: variantStyle.foreground,
      border: variantStyle.border,
      iconBackground: variantStyle.iconBackground,
      actionBackground: variantStyle.actionBackground,
      actionText: variantStyle.actionForeground,
      dismissText: variantStyle.foreground,
    }),
    [variantStyle],
  );

  const title = alert.titleKey ? t(alert.titleKey, alert.titleParams) : "";
  const message = alert.descriptionKey ? t(alert.descriptionKey, alert.descriptionParams) : undefined;
  const actionLabel = alert.actionLabelKey ? t(alert.actionLabelKey, alert.actionLabelParams) : undefined;
  const actionAccessibilityLabel = alert.actionAccessibilityLabelKey
    ? t(alert.actionAccessibilityLabelKey)
    : actionLabel;
  const dismissAccessibilityLabel = t(alert.closeAccessibilityLabelKey ?? "alerts.dismiss");

  const handleActionPress = useCallback(() => {
    void Promise.resolve(alert.onActionPress?.()).finally(() => {
      hide(alert.id, "action");
    });
  }, [alert, hide]);

  const showIcon = alert.showIcon ?? true;
  const icon = showIcon
    ? alert.type === "loading"
      ? <ActivityIndicator color={variantStyle.foreground} size="small" />
      : <Ionicons color={variantStyle.foreground} name={alert.iconName ?? variantStyle.icon} size={20} />
    : undefined;

  return (
    <TopAlertBanner
      dismissAccessibilityLabel={dismissAccessibilityLabel}
      dismissTestID={TOP_ALERT_TEST_IDS.close}
      icon={icon}
      message={message}
      metrics={{ topOffset: insetTop + spacing.xs, horizontalInset: spacing.sm }}
      onDismiss={alert.showCloseButton === false ? undefined : () => hide(alert.id, "close")}
      palette={palette}
      primaryAction={
        actionLabel
          ? {
              accessibilityLabel: actionAccessibilityLabel,
              label: actionLabel,
              onPress: handleActionPress,
              testID: TOP_ALERT_TEST_IDS.action,
            }
          : undefined
      }
      testID={TOP_ALERT_TEST_IDS.banner}
      title={title}
      visible
    />
  );
}
