module.exports = {
    root: true,
    extends: ['eslint:recommended'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      project: "./tsconfig.json",
      tsconfigRootDir: __dirname,
    },
};
