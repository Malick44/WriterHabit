import type { TopAlertApi, TopAlertDismissReason, TopAlertRequest } from "./topAlert.types";

let activeTopAlertApi: TopAlertApi | null = null;

function getTopAlertApi(): TopAlertApi {
  if (!activeTopAlertApi) {
    throw new Error("TopAlertProvider is not mounted.");
  }

  return activeTopAlertApi;
}

export function showTopAlert(alert: TopAlertRequest): string | null {
  return getTopAlertApi().show(alert);
}

export function hideTopAlert(id?: string, reason?: TopAlertDismissReason): void {
  getTopAlertApi().hide(id, reason);
}

export const topAlertManager: TopAlertApi & {
  register: (api: TopAlertApi) => () => void;
} = {
  register(api) {
    activeTopAlertApi = api;

    return () => {
      if (activeTopAlertApi === api) {
        activeTopAlertApi = null;
      }
    };
  },
  show(alert) {
    return showTopAlert(alert);
  },
  hide(id, reason) {
    hideTopAlert(id, reason);
  },
  hideAll(reason) {
    getTopAlertApi().hideAll(reason);
  },
};
