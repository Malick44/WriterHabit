import React, { useEffect } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { I18nProvider } from "@/i18n";

import { TopAlertProvider } from "./TopAlertProvider";
import { TOP_ALERT_TEST_IDS } from "./topAlert.constants";
import { useTopAlert } from "./useTopAlert";
import type { TopAlertRequest, TopAlertType } from "./topAlert.types";

function ProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <TopAlertProvider>{children}</TopAlertProvider>
    </I18nProvider>
  );
}

function AlertTrigger({ alert }: { alert: TopAlertRequest }) {
  const topAlert = useTopAlert();

  useEffect(() => {
    topAlert.show(alert);
  }, [alert, topAlert]);

  return null;
}

async function renderAlert(alert: TopAlertRequest) {
  return render(<AlertTrigger alert={alert} />, { wrapper: ProviderWrapper });
}

describe("TopAlertProvider", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it.each<TopAlertType>(["success", "error", "warning", "info", "neutral", "offline", "loading"])(
    "renders a localized %s alert",
    async (type) => {
      await renderAlert({
        autoDismissMs: null,
        descriptionKey: "alerts.examples.profileSaved.description",
        titleKey: "alerts.examples.profileSaved.title",
        type,
      });

      await waitFor(() => expect(screen.getByText("Profile saved")).toBeTruthy());
      expect(screen.getByText("Your profile changes have been saved.")).toBeTruthy();
      expect(screen.getByTestId(TOP_ALERT_TEST_IDS.banner)).toBeTruthy();
    },
  );

  it("uses localized accessibility labels for the close button", async () => {
    await renderAlert({
      autoDismissMs: null,
      titleKey: "alerts.examples.profileSaved.title",
      type: "success",
    });

    await waitFor(() => expect(screen.getByLabelText("Dismiss alert")).toBeTruthy());
  });

  it("dismisses manually from the close button", async () => {
    const onDismiss = jest.fn();

    await renderAlert({
      autoDismissMs: null,
      onDismiss,
      titleKey: "alerts.examples.profileSaved.title",
      type: "success",
    });

    await waitFor(() => expect(screen.getByTestId(TOP_ALERT_TEST_IDS.close)).toBeTruthy());
    await fireEvent.press(screen.getByTestId(TOP_ALERT_TEST_IDS.close));

    expect(onDismiss).toHaveBeenCalledWith("close");
    expect(screen.queryByText("Profile saved")).toBeNull();
  });

  it("runs the action callback and dismisses", async () => {
    const onActionPress = jest.fn();
    const onDismiss = jest.fn();

    await renderAlert({
      actionAccessibilityLabelKey: "alerts.examples.profileSaved.actionAccessibility",
      actionLabelKey: "alerts.examples.profileSaved.action",
      autoDismissMs: null,
      onActionPress,
      onDismiss,
      titleKey: "alerts.examples.profileSaved.title",
      type: "success",
    });

    await waitFor(() => expect(screen.getByTestId(TOP_ALERT_TEST_IDS.action)).toBeTruthy());
    await fireEvent.press(screen.getByTestId(TOP_ALERT_TEST_IDS.action));

    expect(onActionPress).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith("action");
  });

  it("auto-dismisses after the configured duration", async () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();

    await renderAlert({
      autoDismissMs: 100,
      onDismiss,
      titleKey: "alerts.examples.profileSaved.title",
      type: "success",
    });

    await waitFor(() => expect(screen.getByText("Profile saved")).toBeTruthy());
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(onDismiss).toHaveBeenCalledWith("auto");
  });

  it("cleans up auto-dismiss timers on unmount", async () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    const rendered = await renderAlert({
      autoDismissMs: 100,
      onDismiss,
      titleKey: "alerts.examples.profileSaved.title",
      type: "success",
    });

    await rendered.unmount();

    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });

});
