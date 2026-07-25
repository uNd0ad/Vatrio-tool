import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

// Un singur config la rădăcină acoperă ambele proiecte: aplicația desktop
// (`src/`, React în browser) și crawlerul (`crawler/src/`, Node). Regulile
// type-aware (no-floating-promises) folosesc `projectService`, care descoperă
// automat tsconfig-ul potrivit — cel din rădăcină pentru `src/`, cel din
// `crawler/` pentru crawler.
export default tseslint.config(
  {
    ignores: [
      "dist/",
      "crawler/dist/",
      "crawler/debug/",
      "src-tauri/",
      "graphify-out/",
      "node_modules/",
      "**/node_modules/",
      "public/",
      "scripts/",
      "**/*.d.ts",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Linting cu informație de tip, doar pentru codul-sursă (nu configuri/teste
  // aflate în afara tsconfig-urilor). Aici prindem promise-urile "plutitoare".
  {
    files: ["src/**/*.{ts,tsx}", "crawler/src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      // Handler-ele async pe atribute JSX (`onSubmit`, `onClick`) sunt
      // idiomatice în React și își tratează singure erorile — verificăm
      // restul abuzurilor de Promise, dar nu return-ul void al atributelor.
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },

  // Aplicația desktop React (rulează în browser prin Tauri).
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: {
      globals: { ...globals.browser },
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.flat.recommended.rules,
      "react/react-in-jsx-scope": "off", // JSX transform automat (react-jsx)
      "react/prop-types": "off", // tipurile vin din TypeScript
      "react/no-unescaped-entities": "warn", // apostrofuri în textul românesc
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // `any` apare doar la punți intenționate (API-uri Tauri/browser fără
  // tipuri, generice Supabase prea adânci) — semnalăm, dar nu blocăm.
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      // Prefixul `_` marchează argumente/variabile lăsate intenționat nefolosite.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  // Crawlerul rulează pe Node.
  {
    files: ["crawler/**/*.ts"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Testele au voie cu asserțiuni non-null și pot lăsa variabile nefolosite
  // (fixture-uri, argumente de mock).
  {
    files: ["**/*.test.{ts,tsx}", "vitest.setup.ts"],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unused-vars": "off",
      // `node:test`/vitest `test(...)` returnează un Promise pe care runner-ul
      // îl urmărește singur — apelul fire-and-forget e corect, nu-l semnalăm.
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
    },
  },
);
