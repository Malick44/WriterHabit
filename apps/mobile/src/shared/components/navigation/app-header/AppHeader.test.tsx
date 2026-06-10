import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { I18nProvider } from "@/i18n";

import { AppHeader } from "./AppHeader";
import { APP_HEADER_TEST_IDS } from "./appHeader.constants";

const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}));

function renderHeader(ui: React.ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe("AppHeader", () => {
  afterEach(() => {
    mockBack.mockClear();
  });

  it("renders localized title, subtitle, and text action copy", async () => {
    const onPress = jest.fn();

    const rendered = await renderHeader(
      <AppHeader
        rightActions={[
          {
            accessibilityLabelKey: "common.view",
            labelKey: "common.view",
            onPress,
            type: "text",
          },
        ]}
        subtitleKey="studentHome.description"
        titleKey="studentHome.title"
      />,
    );

    expect(rendered.getByText("Student home")).toBeTruthy();
    expect(rendered.getByText("Daily assignments, draft status, and coaching next steps.")).toBeTruthy();
    await fireEvent.press(rendered.getByText("View"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("uses localized accessibility labels for back and icon actions", async () => {
    const onNotificationsPress = jest.fn();

    const rendered = await renderHeader(
      <AppHeader
        leftAction={{
          accessibilityLabelKey: "common.back",
          type: "back",
        }}
        rightActions={[
          {
            accessibilityLabelKey: "common.notifications",
            icon: "notifications-outline",
            onPress: onNotificationsPress,
            type: "icon",
          },
        ]}
        titleKey="common.appName"
      />,
    );

    await fireEvent.press(rendered.getByLabelText("Back"));
    expect(mockBack).toHaveBeenCalledTimes(1);

    await fireEvent.press(rendered.getByLabelText("Notifications"));
    expect(onNotificationsPress).toHaveBeenCalledTimes(1);
  });

  it("renders localized pill actions with icons", async () => {
    const onPress = jest.fn();

    const rendered = await renderHeader(
      <AppHeader
        rightActions={[
          {
            accessibilityLabelKey: "common.notifications",
            labelKey: "common.notifications",
            leadingIcons: [{ name: "notifications-outline", testID: "header-pill-icon" }],
            onPress,
            type: "pill",
          },
        ]}
        titleKey="common.appName"
      />,
    );

    expect(rendered.getByText("Notifications")).toBeTruthy();
    expect(rendered.getByTestId("header-pill-icon")).toBeTruthy();

    await fireEvent.press(rendered.getByLabelText("Notifications"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders avatar actions with localized accessibility labels", async () => {
    const onProfilePress = jest.fn();

    const rendered = await renderHeader(
      <AppHeader
        rightActions={[
          {
            accessibilityLabelKey: "studentHome.profile.accessibilityLabel",
            imageUri: "https://example.com/avatar.png",
            onPress: onProfilePress,
            type: "avatar",
          },
        ]}
        titleKey="studentHome.title"
      />,
    );

    await fireEvent.press(rendered.getByLabelText("Open profile"));
    expect(onProfilePress).toHaveBeenCalledTimes(1);
    expect(rendered.getByTestId(APP_HEADER_TEST_IDS.avatar)).toBeTruthy();
  });

  it("renders fallback avatar text when no image URI is provided", async () => {
    const onProfilePress = jest.fn();

    const rendered = await renderHeader(
      <AppHeader
        rightActions={[
          {
            accessibilityLabelKey: "studentHome.profile.accessibilityLabel",
            fallbackText: "A",
            onPress: onProfilePress,
            type: "avatar",
          },
        ]}
        titleKey="studentHome.title"
      />,
    );

    expect(rendered.getByText("A")).toBeTruthy();
    await fireEvent.press(rendered.getByLabelText("Open profile"));
    expect(onProfilePress).toHaveBeenCalledTimes(1);
  });

  it("clamps progress values and exposes progress accessibility metadata", async () => {
    const rendered = await renderHeader(
      <AppHeader
        progress={{
          labelKey: "themeTuner.activeScreen",
          showValue: true,
          value: 1.5,
        }}
        titleKey="common.appName"
      />,
    );

    const progress = rendered.getByTestId(APP_HEADER_TEST_IDS.progress);

    expect(rendered.getByText("Active screen")).toBeTruthy();
    expect(rendered.getByText("100%")).toBeTruthy();
    expect(progress.props.accessibilityRole).toBe("progressbar");
    expect(progress.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 100 });
  });
});
