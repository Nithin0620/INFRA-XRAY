module.exports = {
  env: { node: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
  ],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' }
}
