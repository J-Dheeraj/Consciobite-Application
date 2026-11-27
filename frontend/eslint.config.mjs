import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// Flat config replacing .eslintrc.json. Next 16 removed `next lint`, so
// linting runs through the ESLint CLI. The jsx-a11y plugin is already
// registered by eslint-config-next; these entries keep the old severities.
const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [".next/**", "out/**", "build/**", "node_modules/**", "public/**"],
  },
  {
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "warn",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/anchor-has-content": "warn",
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-role": "warn",
      "jsx-a11y/heading-has-content": "warn",
      "jsx-a11y/img-redundant-alt": "warn",
      "jsx-a11y/no-access-key": "warn",
      "jsx-a11y/no-redundant-roles": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",
      // New in eslint-plugin-react-hooks 7 (React Compiler rules). They flag
      // 9 existing setState-in-effect / ref-in-render patterns that worked
      // fine under React 18 and 19. Kept as warnings so the framework upgrade
      // stays a framework upgrade; fixing them is a separate refactor.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
];

export default eslintConfig;
