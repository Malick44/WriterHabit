import { create } from "zustand";

import { preferencesStorage } from "@/services/storage/preferencesStorage";
import { storageKeys } from "@/services/storage/storageKeys";

interface TypedCopyInputPreferenceState {
  enabled: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setEnabled: (enabled: boolean) => Promise<void>;
}

/**
 * Whether the typed-copy text box is shown on the assignment "Typed copy"
 * step. Hidden by default to keep the flow handwriting-first; students (or
 * grown-ups) can turn it on from app settings. Shared as a store so the
 * settings screen and the assignment screen stay in sync without a reload.
 */
export const useTypedCopyInputPreference =
  create<TypedCopyInputPreferenceState>()((set, get) => ({
    enabled: false,
    hydrated: false,
    hydrate: async () => {
      if (get().hydrated) {
        return;
      }

      const enabled = await preferencesStorage.getPreference(
        storageKeys.typedCopyInputEnabled,
        false,
      );

      set((state) => (state.hydrated ? state : { enabled, hydrated: true }));
    },
    setEnabled: async (enabled) => {
      set({ enabled, hydrated: true });
      await preferencesStorage.setPreference(
        storageKeys.typedCopyInputEnabled,
        enabled,
      );
    },
  }));
