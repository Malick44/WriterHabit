import '@testing-library/react-native';

// Set up mock env variables for tests before modules are loaded
process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "dummy-publishable-key";

jest.mock('react-native-reanimated', () => {
  const ReactNative = require('react-native');

  const createAnimatedComponent = (Component: unknown) => Component;
  const interpolate = (value: number, input: number[], output: number[]) => {
    if (value <= input[0]) {
      return output[0];
    }

    if (value >= input[input.length - 1]) {
      return output[output.length - 1];
    }

    const inputRange = input[1] - input[0];
    const outputRange = output[1] - output[0];
    const progress = inputRange === 0 ? 0 : (value - input[0]) / inputRange;

    return output[0] + outputRange * progress;
  };
  const runAnimation = (
    toValue: number,
    configOrCallback?: unknown,
    callback?: (finished: boolean) => void,
  ) => {
    const completion = typeof configOrCallback === "function" ? configOrCallback : callback;
    completion?.(true);
    return toValue;
  };
  const Animated = {
    Pressable: ReactNative.Pressable,
    ScrollView: ReactNative.ScrollView,
    View: ReactNative.View,
    createAnimatedComponent,
  };

  return {
    Easing: {
      cubic: (value: number) => value,
      in: (easing: unknown) => easing,
      out: (easing: unknown) => easing,
    },
    __esModule: true,
    cancelAnimation: jest.fn(),
    createAnimatedComponent,
    default: Animated,
    interpolate,
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
    useAnimatedStyle: (updater: () => unknown) => updater(),
    useSharedValue: (value: unknown) => ({ value }),
    withSpring: runAnimation,
    withTiming: runAnimation,
  };
});

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');

  function createGesture() {
    const gesture = {
      activeOffsetY: () => gesture,
      enabled: () => gesture,
      failOffsetX: () => gesture,
      onEnd: () => gesture,
      onUpdate: () => gesture,
    };

    return gesture;
  }

  return {
    Gesture: {
      Pan: createGesture,
    },
    GestureDetector: ({ children }: { children: unknown }) => children,
    GestureHandlerRootView: ({ children, ...props }: { children?: unknown }) =>
      React.createElement(View, props, children),
  };
});

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
