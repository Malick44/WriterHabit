import type { ModalApi } from "./types";

let activeModalApi: ModalApi | null = null;

function getModalApi(): ModalApi {
  if (!activeModalApi) {
    throw new Error("ModalProvider is not mounted.");
  }

  return activeModalApi;
}

export const modalManager: ModalApi & {
  register: (api: ModalApi) => () => void;
} = {
  register(api) {
    activeModalApi = api;

    return () => {
      if (activeModalApi === api) {
        activeModalApi = null;
      }
    };
  },
  show(options) {
    return getModalApi().show(options);
  },
  bottomSheet(options) {
    return getModalApi().bottomSheet(options);
  },
  dismiss(id, reason) {
    getModalApi().dismiss(id, reason);
  },
  dismissAll(reason) {
    getModalApi().dismissAll(reason);
  },
  alert(options) {
    return getModalApi().alert(options);
  },
  confirm(options) {
    return getModalApi().confirm(options);
  },
};
