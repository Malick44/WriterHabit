import { useContext } from "react";

import { TopAlertContext } from "./TopAlertContext";

export function useTopAlert() {
  const context = useContext(TopAlertContext);

  if (!context) {
    throw new Error("useTopAlert must be used within TopAlertProvider.");
  }

  return context;
}
