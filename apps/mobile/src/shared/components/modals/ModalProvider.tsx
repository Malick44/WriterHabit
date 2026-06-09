import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import { Modal } from "./Modal";
import { modalManager } from "./modalManager";
import type {
  AlertModalOptions,
  ConfirmationModalOptions,
  ManagedModalEntry,
  ManagedModalOptions,
  ModalApi,
  ModalCloseReason,
} from "./types";

export const ModalContext = createContext<ModalApi | null>(null);

type PendingResolver = {
  resolve: (value: boolean | undefined) => void;
  dismissValue: boolean | undefined;
};

let modalIdSequence = 0;

function createModalId(prefix = "modal"): string {
  modalIdSequence += 1;
  return `${prefix}-${Date.now()}-${modalIdSequence}`;
}

export function ModalProvider({ children }: PropsWithChildren) {
  const [entries, setEntries] = useState<ManagedModalEntry[]>([]);
  const pendingResolversRef = useRef(new Map<string, PendingResolver>());

  const settle = useCallback((id: string, value?: boolean) => {
    const pending = pendingResolversRef.current.get(id);

    if (!pending) {
      return;
    }

    pendingResolversRef.current.delete(id);
    pending.resolve(value);
  }, []);

  const dismiss = useCallback(
    (id?: string, reason: ModalCloseReason = "programmatic") => {
      setEntries((current) => {
        const targetId = id ?? current.at(-1)?.id;

        if (!targetId) {
          return current;
        }

        const pending = pendingResolversRef.current.get(targetId);
        if (pending) {
          settle(targetId, pending.dismissValue);
        }

        return current.map((entry) => (entry.id === targetId ? { ...entry, visible: false } : entry));
      });
    },
    [settle],
  );

  const dismissAll = useCallback(
    (reason: ModalCloseReason = "programmatic") => {
      setEntries((current) => {
        current.forEach((entry) => {
          const pending = pendingResolversRef.current.get(entry.id);
          if (pending) {
            settle(entry.id, pending.dismissValue);
          }
        });

        return current.map((entry) => ({ ...entry, visible: false }));
      });
    },
    [settle],
  );

  const show = useCallback((options: ManagedModalOptions): string => {
    const id = options.id ?? createModalId("modal");

    setEntries((current) => [...current, { ...options, id, visible: true }]);

    return id;
  }, []);

  const bottomSheet = useCallback(
    (options: ManagedModalOptions): string => {
      return show({ ...options, mode: "bottomSheet" });
    },
    [show],
  );

  const alert = useCallback(
    (options: AlertModalOptions): Promise<void> => {
      return new Promise<void>((resolve) => {
        const id = options.id ?? createModalId("alert");

        pendingResolversRef.current.set(id, {
          dismissValue: undefined,
          resolve: () => resolve(),
        });

        show({
          ...options,
          id,
          actions: [
            {
              accessibilityLabelKey: options.confirmAccessibilityLabelKey,
              id: "confirm",
              labelKey: options.confirmLabelKey ?? "modal.confirm",
              onPress: () => {
                settle(id, undefined);
              },
              variant: "primary",
            },
          ],
          dismissible: options.dismissible ?? true,
          mode: options.mode ?? "dialog",
          renderContent: options.renderContent,
        });
      });
    },
    [settle, show],
  );

  const confirm = useCallback(
    (options: ConfirmationModalOptions): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        const id = options.id ?? createModalId("confirm");

        pendingResolversRef.current.set(id, {
          dismissValue: false,
          resolve: (value) => resolve(value === true),
        });

        show({
          ...options,
          id,
          actions: [
            {
              accessibilityLabelKey: options.cancelAccessibilityLabelKey,
              closeOnPress: true,
              id: "cancel",
              labelKey: options.cancelLabelKey ?? "modal.cancel",
              onPress: () => {
                settle(id, false);
              },
              variant: "secondary",
            },
            {
              accessibilityLabelKey: options.confirmAccessibilityLabelKey,
              closeOnPress: true,
              id: "confirm",
              labelKey: options.confirmLabelKey ?? "modal.confirm",
              onPress: () => {
                settle(id, true);
              },
              variant: options.destructive ? "danger" : "primary",
            },
          ],
          dismissible: options.dismissible ?? true,
          mode: options.mode ?? "dialog",
          renderContent: options.renderContent,
        });
      });
    },
    [settle, show],
  );

  const removeClosedEntry = useCallback((id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const api = useMemo<ModalApi>(
    () => ({
      alert,
      bottomSheet,
      confirm,
      dismiss,
      dismissAll,
      show,
    }),
    [alert, bottomSheet, confirm, dismiss, dismissAll, show],
  );

  useEffect(() => modalManager.register(api), [api]);

  useEffect(() => {
    return () => {
      pendingResolversRef.current.forEach((pending) => {
        pending.resolve(pending.dismissValue);
      });
      pendingResolversRef.current.clear();
    };
  }, []);

  return (
    <ModalContext.Provider value={api}>
      {children}
      {entries.map((entry) => (
        <Modal
          {...entry}
          key={entry.id}
          onAfterClose={() => removeClosedEntry(entry.id)}
          onClose={(reason) => dismiss(entry.id, reason)}
        />
      ))}
    </ModalContext.Provider>
  );
}
