import "expo-sqlite/localStorage/install";

const LOCAL_JSON_PREFIX = "WriterHabit.local.";
const localStorageKeyPattern = /[^A-Za-z0-9._-]/g;

function toLocalJsonKey(key: string) {
  const normalized = key.replace(localStorageKeyPattern, (char) => `_${char.charCodeAt(0).toString(16)}_`);
  return `${LOCAL_JSON_PREFIX}${normalized || "empty"}`;
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

export const localJsonStorage = {
  async getItem<T>(key: string, fallback: T): Promise<T> {
    return safeParse(localStorage.getItem(toLocalJsonKey(key)), fallback);
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    localStorage.setItem(toLocalJsonKey(key), JSON.stringify(value));
  },

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(toLocalJsonKey(key));
  },
};
