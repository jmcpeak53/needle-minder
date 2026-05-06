const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: ["node_modules/**", ".expo/**", "coverage/**"]
  },
  {
    files: ["app/**/*.{ts,tsx}", "src/ui/**/*.{ts,tsx}", "src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["expo-sqlite"],
              message: "Use src/db/database.ts or repository modules instead of raw SQLite in UI code."
            }
          ]
        }
      ]
    }
  }
];
