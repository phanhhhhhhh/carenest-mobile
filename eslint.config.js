// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Noisy false positive on axios' default export (`axios.create`).
      'import/no-named-as-default-member': 'off',
    },
  },
  {
    ignores: ['dist/*', 'node_modules/*', 'backend/*'],
  },
]);
