// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      // Reanimated shared values are mutated through `.value` by design
      // (e.g. `progress.value = withTiming(...)` in Modal.tsx); the rule
      // cannot distinguish them from React-managed immutable values.
      "react-hooks/immutability": "off",
    },
  },
  {
    // Jest hoists `jest.mock` factories above imports, so shared mock state
    // (`const mockStore = ...`) must stay declared before the import block to
    // avoid TDZ errors when the factory runs during module resolution.
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "import/first": "off",
    },
  },
  {
    // Node/Jest context: requires inside jest.mock factories cannot be
    // converted to static imports.
    files: ["jest.setup.ts", "jest.config.js", "eslint.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
