import { useEffect, type ReactNode } from "react";

import { useAuthStore } from "./authStore";

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    void hydrateSession().then(() => {
      if (!isMounted) {
        return;
      }

      const currentSession = useAuthStore.getState().session;

      if (currentSession?.source === "mock") {
        return;
      }

      void import("./sessionService").then(({ sessionService }) => {
        if (!isMounted) {
          return;
        }

        unsubscribe = sessionService.subscribeToSessionChanges((session) => {
          setSession(session);
        });
      }).catch(() => {
        if (!isMounted) {
          return;
        }

        useAuthStore.getState().setErrorCode("restore_failed");
      });
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [hydrateSession, setSession]);

  return children;
}
