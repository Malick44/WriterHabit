import * as SecureStore from 'expo-secure-store';

const PREFERENCES_PREFIX = 'writewise.pref.';
const secureStoreKeyPattern = /[^A-Za-z0-9._-]/g;

function toPreferenceKey(key: string) {
    const normalized = key.replace(secureStoreKeyPattern, (char) => `_${char.charCodeAt(0).toString(16)}_`);
    return `${PREFERENCES_PREFIX}${normalized || 'empty'}`;
}

function safeParse<T>(value: string | null, fallback: T): T {
    if (value === null) {
        return fallback;
    }

    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
}

export const preferencesStorage = {
    async getPreference<T>(key: string, fallback: T): Promise<T> {
        const rawValue = await SecureStore.getItemAsync(toPreferenceKey(key));
        return safeParse(rawValue, fallback);
    },

    async setPreference<T>(key: string, value: T): Promise<void> {
        await SecureStore.setItemAsync(toPreferenceKey(key), JSON.stringify(value));
    },

    async removePreference(key: string): Promise<void> {
        await SecureStore.deleteItemAsync(toPreferenceKey(key));
    },
};
