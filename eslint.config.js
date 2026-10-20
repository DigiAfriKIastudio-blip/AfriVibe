/**
 * Configuration ESLint (flat config) alignée sur Expo.
 * Lancer : `npm run lint`
 */
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'android/*', 'ios/*', 'coverage/*'],
  },
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Le lecteur `expo-video` est un objet natif impératif : ses propriétés
      // (currentTime, muted, loop…) se modifient par affectation. La règle du
      // compilateur React ne peut pas modéliser cette API.
      'react-hooks/immutability': 'off',
      // Synchroniser l'état UI avec un lecteur natif dans un effet est normal.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    files: ['jest.setup.js', 'jest.config.js', 'eslint.config.js'],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['src/**/__tests__/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
];
