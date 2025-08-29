module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': 'off', // Disabled to avoid CRLF vs LF issues across platforms
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': ['warn'],
    'no-console': ['warn'],
  },
};
