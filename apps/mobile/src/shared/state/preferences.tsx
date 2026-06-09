import type { ReactNode } from 'react';
import { create } from 'zustand';

export type UserPreferences = {
	reduceMotion: boolean;
	autoDownloadOffline: boolean;
};

export const defaultUserPreferences: UserPreferences = {
	reduceMotion: false,
	autoDownloadOffline: false,
};

type PreferencesStore = {
	preferences: UserPreferences;
	setReduceMotion: (value: boolean) => void;
	setAutoDownloadOffline: (value: boolean) => void;
};

const usePreferencesStore = create<PreferencesStore>()((set) => ({
	preferences: defaultUserPreferences,
	setReduceMotion: (value) => set((state) => ({ preferences: { ...state.preferences, reduceMotion: value } })),
	setAutoDownloadOffline: (value) => set((state) => ({ preferences: { ...state.preferences, autoDownloadOffline: value } })),
}));

export function PreferencesProvider({ children }: { children: ReactNode }) {
	return children;
}

export function usePreferences(): PreferencesStore {
	return usePreferencesStore();
}
