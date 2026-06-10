import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import { TopAlertBanner } from "./TopAlertBanner";
import { TopAlertContext } from "./TopAlertContext";
import { topAlertManager } from "./topAlertManager";
import { TopAlertQueue } from "./topAlertQueue";
import type { TopAlertApi, TopAlertDismissReason, TopAlertEntry, TopAlertRequest } from "./topAlert.types";

export function TopAlertProvider({ children }: PropsWithChildren) {
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

  return (
    <TopAlertContext.Provider value={api}>
      {children}
      {activeAlert ? <TopAlertBanner alert={activeAlert} key={activeAlert.id} onDismiss={hide} /> : null}
    </TopAlertContext.Provider>
  );
}
