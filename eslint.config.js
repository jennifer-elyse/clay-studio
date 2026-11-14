import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: [
      "apps/studio/src/**/*.{js,jsx}",
      "packages/chat-sdk/src/**/*.{js,jsx}",
      "packages/chat-sdk/stories/**/*.{js,jsx}",
    ],
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: ["apps/**/*.{js,jsx}", "packages/**/*.{js,jsx}"],
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
    files: ["apps/**/*.jsx", "packages/**/*.jsx"],
    rules: {
      "max-lines": ["error", { max: 50, skipBlankLines: false, skipComments: false }],
    },
  },
  {
    ignores: ["**/dist/**", "**/storybook-static/**", "templates/**", "coverage/**", "**/.clay/**", "**/node_modules/**"],
  },
];
