import * as SecureStore from 'expo-secure-store';

const SECURE_PREFIX = 'WriterHabit.secure.';
const secureStoreKeyPattern = /[^A-Za-z0-9._-]/g;

function toSecureKey(key: string) {
    const normalized = key.replace(secureStoreKeyPattern, (char) => `_${char.charCodeAt(0).toString(16)}_`);
    return `${SECURE_PREFIX}${normalized || 'empty'}`;
}

export const secureStorage = {
    async getItem(key: string): Promise<string | null> {
        return SecureStore.getItemAsync(toSecureKey(key));
    },

    async setItem(key: string, value: string): Promise<void> {
        await SecureStore.setItemAsync(toSecureKey(key), value);
    },

    async removeItem(key: string): Promise<void> {
        await SecureStore.deleteItemAsync(toSecureKey(key));
    },
};
