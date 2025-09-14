module.exports = {
  root: true,
  extends: [
    'expo',
    'plugin:jest/recommended',
    'plugin:jest/style',
  ],
  plugins: ['jest'],
  env: {
    'jest/globals': true,
    'browser': true,
    'node': true,
    'es6': true,
  },
  rules: {
    // Disable the rule for require() in test files
    '@typescript-eslint/no-var-requires': 'off',
    // Allow unused variables that start with underscore
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    // Allow test hooks to be unused
    'jest/valid-hook': 'off',
    // Allow test hooks to be used before they are defined
    'no-use-before-define': 'off',
    // Allow @ts-ignore and @ts-nocheck comments
    '@typescript-eslint/ban-ts-comment': 'off',
    // Allow any type in test files
    '@typescript-eslint/no-explicit-any': 'off',
  },
  overrides: [
    {
      // Apply these rules to test files only
      files: ['**/__tests__/**/*', '**/*.{spec,test}.*', '**/jest.setup.*'],
      rules: {
        // Disable prop-types in test files
        'react/prop-types': 'off',
        // Allow console in test files
        'no-console': 'off',
      },
    },
  ],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
};
