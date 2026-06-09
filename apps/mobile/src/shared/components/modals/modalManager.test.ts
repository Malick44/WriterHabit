import { modalManager } from "./modalManager";
import type { ModalApi } from "./types";

function createMockApi(): jest.Mocked<ModalApi> {
  return {
    alert: jest.fn<Promise<void>, Parameters<ModalApi["alert"]>>().mockResolvedValue(undefined),
    bottomSheet: jest.fn<string, Parameters<ModalApi["bottomSheet"]>>().mockReturnValue("bottom-sheet-id"),
    confirm: jest.fn<Promise<boolean>, Parameters<ModalApi["confirm"]>>().mockResolvedValue(true),
    dismiss: jest.fn(),
    dismissAll: jest.fn(),
    show: jest.fn<string, Parameters<ModalApi["show"]>>().mockReturnValue("modal-id"),
  };
}

describe("modalManager", () => {
  it("routes calls to the registered modal provider", async () => {
    const api = createMockApi();
    const unregister = modalManager.register(api);

    expect(modalManager.show({ titleKey: "modal.confirm" })).toBe("modal-id");
    expect(modalManager.bottomSheet({ titleKey: "modal.confirm" })).toBe("bottom-sheet-id");
    await expect(modalManager.confirm({ titleKey: "modal.confirm" })).resolves.toBe(true);
    await expect(modalManager.alert({ titleKey: "modal.confirm" })).resolves.toBeUndefined();

    modalManager.dismiss("modal-id");
    modalManager.dismissAll();

    expect(api.show).toHaveBeenCalledWith({ titleKey: "modal.confirm" });
    expect(api.dismiss).toHaveBeenCalledWith("modal-id", undefined);
    expect(api.dismissAll).toHaveBeenCalledWith(undefined);

    unregister();
  });

  it("clears only the active registration", () => {
    const firstApi = createMockApi();
    const secondApi = createMockApi();
    const unregisterFirst = modalManager.register(firstApi);
    const unregisterSecond = modalManager.register(secondApi);

    unregisterFirst();
    expect(modalManager.show({ titleKey: "modal.confirm" })).toBe("modal-id");
    expect(secondApi.show).toHaveBeenCalledTimes(1);

    unregisterSecond();
    expect(() => modalManager.show({ titleKey: "modal.confirm" })).toThrow("ModalProvider is not mounted.");
  });
});
