import { useEffect, type ReactNode } from "react";
import * as Linking from "expo-linking";

import { useAuthStore } from "./authStore";
import { sessionService } from "./sessionService";

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const setSession = useAuthStore((state) => state.setSession);
  const setErrorCode = useAuthStore((state) => state.setErrorCode);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;
    let removeDeepLinkListener: (() => void) | undefined;

    void hydrateSession().then(() => {
      if (!isMounted) {
        return;
      }

      const currentSession = useAuthStore.getState().session;

      if (currentSession?.source === "mock") {
        return;
      }

      const handleAuthCallbackUrl = async (url: string | null) => {
        if (!url || !isMounted) {
          return;
        }

        try {
          const recoveredSession = await sessionService.recoverSessionFromUrl(url);

          if (recoveredSession && isMounted) {
            setSession(recoveredSession);
          }
        } catch {
          if (isMounted) {
            setErrorCode("sign_in_failed");
          }
        }
      };

      const deepLinkSubscription = Linking.addEventListener("url", (event) => {
        void handleAuthCallbackUrl(event.url);
      });
      removeDeepLinkListener = () => {
        deepLinkSubscription.remove();
      };

      void Linking.getInitialURL().then(handleAuthCallbackUrl).catch(() => {
        if (isMounted) {
          setErrorCode("sign_in_failed");
        }
      });

      unsubscribe = sessionService.subscribeToSessionChanges((session) => {
        setSession(session);
      });
    });

    return () => {
      isMounted = false;
      removeDeepLinkListener?.();
      unsubscribe?.();
    };
  }, [hydrateSession, setErrorCode, setSession]);

  return children;
}
