module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src', '<rootDir>/../../tests'],
  moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: [
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.test.tsx',
    '<rootDir>/../../tests/unit/**/*.test.ts',
    '<rootDir>/../../tests/unit/**/*.test.tsx',
    '<rootDir>/../../tests/integration/**/*.test.ts',
    '<rootDir>/../../tests/integration/**/*.test.tsx',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/core/(.*)$': '<rootDir>/src/core/$1',
    '^@/features/(.*)$': '<rootDir>/src/features/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@writewise/shared$': '<rootDir>/../../packages/shared/src',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/types.ts',
  ],
};
