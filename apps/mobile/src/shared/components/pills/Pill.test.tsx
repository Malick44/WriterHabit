import { fireEvent, render } from "@testing-library/react-native";

import { Pill } from "./Pill";

describe("Pill", () => {
  it("renders label and leading/trailing icons", async () => {
    const rendered = await render(
      <Pill
        label="Draft"
        leadingIcons={[{ name: "create-outline", testID: "leading-icon" }]}
        trailingIcons={[{ name: "chevron-forward", testID: "trailing-icon" }]}
      />,
    );

    expect(rendered.getByText("Draft")).toBeTruthy();
    expect(rendered.getByTestId("leading-icon")).toBeTruthy();
    expect(rendered.getByTestId("trailing-icon")).toBeTruthy();
  });

  it("uses button accessibility and calls onPress when interactive", async () => {
    const onPress = jest.fn();
    const rendered = await render(
      <Pill
        accessibilityLabel="Open draft tools"
        label="Tools"
        leadingIcons={[{ name: "options-outline" }]}
        onPress={onPress}
      />,
    );

    await fireEvent.press(rendered.getByLabelText("Open draft tools"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
