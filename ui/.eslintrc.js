/* eslint-disable quotes */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  env: {
    node: true,
  },
  parserOptions: {
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "react","prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  rules: {
    "@typescript-eslint/no-use-before-define": [
      "error",
      { functions: false, classes: false },
    ],
    "@typescript-eslint/no-unused-vars": [1],
    "@typescript-eslint/explicit-function-return-type": [
      0,
      { allowExpressions: true },
    ],
    "space-infix-ops": ["error", { int32Hint: false }],
    "no-multi-spaces": ["error", { ignoreEOLComments: true }],
    "keyword-spacing": ["error"],
    "@typescript-eslint/no-namespace": "off",
  },
};
