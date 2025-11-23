module.exports = {
    root: true,
    extends: ['eslint:recommended'],
    parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
    },
};
