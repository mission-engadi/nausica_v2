import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // The site copy is Italian and full of apostrophes and quotation marks ("dell'evento").
      // JSX renders them correctly; escaping them as &apos;/&quot; only hurts readability.
      "react/no-unescaped-entities": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // firebase-tools build copy left behind by `firebase deploy`:
    ".firebase/**",
    // Local admin tutorial material (git-ignored, not part of the site):
    "admin-tutorial/**",
    "admin-tutorial-hf/**",
    "scripts/**",
  ]),
]);

export default eslintConfig;
