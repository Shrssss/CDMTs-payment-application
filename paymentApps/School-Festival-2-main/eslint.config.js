// ESLint フラットコンフィグ(ESLint 9〜/typescript-eslint 8〜)。
// src/legacy/square/ は TypeScript移行の対象外(.js/.jsx)で、意図的に
// 触らない方針(README「Squareコードの隔離について」参照)のため、lintも対象外にする。
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "build/**", "src/legacy/square/**"],
  },
  {
    // アクティブなTypeScriptソース(.ts/.tsx)。テストファイルは下のブロックで別扱い。
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/__tests__/**"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // eslint-plugin-react-hooks v7の既定(recommended/recommended-latestとも)は
      // React Compiler向けの厳格な純粋性ルール一式(purity/refs/set-state-in-effect等)を
      // 丸ごと含む。本プロジェクトはReact Compilerを使っておらず、これらは
      // useRef(Date.now())やuseEffect内でのfetch-on-mountのような既存の一般的な
      // パターンを軒並みエラーにしてしまうため、実際にバグを検出する古典的な2ルール
      // (条件付きhooks呼び出し・依存配列の誤り)だけを個別に有効化する。
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": "warn",
      // 日本語UIの全角スペース(例: "{qty}個　¥{price}")を誤検知するため、
      // 文字列・テンプレートリテラル・JSXテキスト内は許容する。
      "no-irregular-whitespace": [
        "error",
        { skipStrings: true, skipTemplates: true, skipComments: true, skipJSXText: true },
      ],
    },
  },
  {
    // Jestテストファイル(.test.js。JSXを直接書いているものもある)。
    // 型チェックは行わず、明らかな問題(未使用変数等)だけを拾う軽量な設定。
    files: ["src/**/__tests__/**/*.test.js"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node, ...globals.jest },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  }
);
