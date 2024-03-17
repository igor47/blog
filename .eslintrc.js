module.exports = {
  extends: [
    "eslint:recommended",
    "next",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  plugins: ["@typescript-eslint", "unused-imports"],
  rules: {
    "@next/next/no-img-element": "off",
  },
};
