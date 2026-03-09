import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // ... 其他规则
      "@typescript-eslint/no-explicit-any": "off", // 允许使用 any 类型
      "@typescript-eslint/no-unsafe-assignment": "off", // 允许 any 赋值
      "@typescript-eslint/no-unsafe-member-access": "off", // 允许访问 any 的属性
      "@typescript-eslint/no-unsafe-call": "off", // 允许调用 any 类型的函数
      "@typescript-eslint/no-unsafe-return": "off", // 允许返回 any 类型
    },
  },
]);
