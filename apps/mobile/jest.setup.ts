import '@testing-library/react-native';

// Set up mock env variables for tests before modules are loaded
process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "dummy-publishable-key";

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    runSync: jest.fn(),
    getFirstSync: jest.fn(),
    getAllSync: jest.fn(),
  })),
}));

jest.mock('expo-sqlite/localStorage/install', () => ({}));

// Provide a mock global localStorage for Supabase client persistence in Jest tests
const store: Record<string, string> = {};
global.localStorage = {
  getItem: jest.fn((key: string) => store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete store[key];
  }),
  clear: jest.fn(() => {
    Object.keys(store).forEach((key) => delete store[key]);
  }),
  get length() {
    return Object.keys(store).length;
  },
  key: jest.fn((index: number) => Object.keys(store)[index] || null),
};


