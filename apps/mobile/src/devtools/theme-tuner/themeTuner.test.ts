import { act, renderHook } from "@testing-library/react-native";

import { useThemeTunerStore } from "./store/themeTunerStore";
import { useTunableToken, useTunableTokenOverrides, useTunableTokens } from "./hooks/useTunableToken";
import type { TunableScreenConfig } from "./types";

const screenConfig: TunableScreenConfig = {
  feature: "student-home",
  id: "test-screen",
  name: "Test Screen",
  route: "/test",
  tokens: [
    { defaultValue: "#ffffff", kind: "color", path: "colors.cardBackground" },
    { defaultValue: 12, kind: "radius", path: "radius.card" },
  ],
};

const defaults = {
  "colors.cardBackground": "#ffffff",
  "radius.card": 12,
} as const;

describe("themeTunerStore", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useThemeTunerStore.setState({
      activeScreenId: null,
      components: {},
      isPanelOpen: false,
      overrides: {},
      screens: {},
      selectedComponentId: null,
      selectedScreenId: null,
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("registers screens and tracks the active screen", () => {
    const store = useThemeTunerStore.getState();

    store.registerScreen(screenConfig);
    store.setActiveScreen(screenConfig.id);

    expect(useThemeTunerStore.getState().screens[screenConfig.id]).toBe(screenConfig);
    expect(useThemeTunerStore.getState().activeScreenId).toBe(screenConfig.id);

    useThemeTunerStore.getState().clearActiveScreen(screenConfig.id);
    expect(useThemeTunerStore.getState().activeScreenId).toBeNull();
  });

  it("sets, resets, and clears token overrides", () => {
    const store = useThemeTunerStore.getState();

    store.setTokenOverride("test-screen", "colors.cardBackground", "#000000");
    store.setTokenOverride("test-screen", "radius.card", 24);
    store.setTokenOverride("other-screen", "radius.card", 4);

    expect(useThemeTunerStore.getState().overrides["test-screen"]).toEqual({
      "colors.cardBackground": "#000000",
      "radius.card": 24,
    });

    useThemeTunerStore.getState().resetTokenOverride("test-screen", "radius.card");
    expect(useThemeTunerStore.getState().overrides["test-screen"]).toEqual({
      "colors.cardBackground": "#000000",
    });

    useThemeTunerStore.getState().resetScreenOverrides("test-screen");
    expect(useThemeTunerStore.getState().overrides["test-screen"]).toBeUndefined();
    expect(useThemeTunerStore.getState().overrides["other-screen"]).toEqual({ "radius.card": 4 });

    useThemeTunerStore.getState().resetAllOverrides();
    expect(useThemeTunerStore.getState().overrides).toEqual({});
  });

  it("removes the screen override map when its last token is reset", () => {
    useThemeTunerStore.getState().setTokenOverride("test-screen", "radius.card", 24);
    useThemeTunerStore.getState().resetTokenOverride("test-screen", "radius.card");

    expect(useThemeTunerStore.getState().overrides["test-screen"]).toBeUndefined();
  });
});

describe("tunable token hooks", () => {
  beforeEach(() => {
    useThemeTunerStore.setState({ overrides: {} });
  });

  it("returns the defaults object identity when nothing is overridden", async () => {
    const { result } = await renderHook(() => useTunableTokens("test-screen", defaults));

    expect(result.current).toBe(defaults);
  });

  it("merges live overrides over defaults", async () => {
    const { result } = await renderHook(() => useTunableTokens("test-screen", defaults));

    await act(async () => {
      useThemeTunerStore.setState({ overrides: { "test-screen": { "radius.card": 24 } } });
    });

    expect(result.current).toEqual({
      "colors.cardBackground": "#ffffff",
      "radius.card": 24,
    });
  });

  it("exposes single tokens and raw override maps", async () => {
    const token = await renderHook(() => useTunableToken("test-screen", "colors.cardBackground", "#ffffff"));
    const overrides = await renderHook(() => useTunableTokenOverrides("test-screen"));

    expect(token.result.current).toBe("#ffffff");
    expect(Object.keys(overrides.result.current)).toHaveLength(0);

    await act(async () => {
      useThemeTunerStore.setState({
        overrides: { "test-screen": { "colors.cardBackground": "#123456" } },
      });
    });

    expect(token.result.current).toBe("#123456");
    expect(overrides.result.current).toEqual({ "colors.cardBackground": "#123456" });
  });
});
