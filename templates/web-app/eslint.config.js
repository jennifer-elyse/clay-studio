import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["client/**/*.{js,jsx}"],
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: ["client/**/*.{js,jsx}", "server/**/*.js"],
    plugins: { react },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "detect" } },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      eqeqeq: ["error", "always"],
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "off",
    },
  },
  {
    files: ["client/**/*.jsx"],
    rules: {
      "max-lines": ["error", { max: 50, skipBlankLines: false, skipComments: false }],
    },
  },
  {
    ignores: ["**/dist/**", "**/node_modules/**", "coverage/**"],
  },
];
