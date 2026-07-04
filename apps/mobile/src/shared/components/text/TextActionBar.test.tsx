import type { ReactElement } from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { I18nProvider } from "@/i18n";

import { TextActionBar } from "./TextActionBar";

function renderBar(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe("TextActionBar", () => {
  it("renders only the actions that were given handlers", async () => {
    const rendered = await renderBar(
      <TextActionBar onCopy={jest.fn()} onReadAloud={jest.fn()} testID="bar" />,
    );

    expect(rendered.getByTestId("bar-readAloud")).toBeTruthy();
    expect(rendered.getByTestId("bar-copy")).toBeTruthy();
    expect(rendered.queryByTestId("bar-like")).toBeNull();
    expect(rendered.queryByTestId("bar-dislike")).toBeNull();
    expect(rendered.queryByTestId("bar-more")).toBeNull();
  });

  it("renders nothing when no handlers are given", async () => {
    const rendered = await renderBar(<TextActionBar testID="bar" />);

    expect(rendered.queryByTestId("bar")).toBeNull();
  });

  it("exposes accessible buttons and forwards presses", async () => {
    const onLike = jest.fn();
    const rendered = await renderBar(<TextActionBar onLike={onLike} testID="bar" />);

    await fireEvent.press(rendered.getByLabelText("This helped"));
    expect(onLike).toHaveBeenCalledTimes(1);
  });

  it("does not fire disabled actions", async () => {
    const onCopy = jest.fn();
    const rendered = await renderBar(
      <TextActionBar disabledActions={["copy"]} onCopy={onCopy} testID="bar" />,
    );

    await fireEvent.press(rendered.getByTestId("bar-copy"));
    expect(onCopy).not.toHaveBeenCalled();
  });

  it("keeps loading actions pressable so the press can cancel", async () => {
    const onReadAloud = jest.fn();
    const rendered = await renderBar(
      <TextActionBar loadingActions={["readAloud"]} onReadAloud={onReadAloud} testID="bar" />,
    );

    await fireEvent.press(rendered.getByTestId("bar-readAloud"));
    expect(onReadAloud).toHaveBeenCalledTimes(1);
  });

  it("switches the read-aloud label when the action is active", async () => {
    const rendered = await renderBar(
      <TextActionBar activeActions={["readAloud"]} onReadAloud={jest.fn()} testID="bar" />,
    );

    expect(rendered.getByLabelText("Stop reading")).toBeTruthy();
  });
});
