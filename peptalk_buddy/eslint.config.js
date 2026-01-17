// https://docs.expo.dev/guides/using-eslint/
const expoConfig = require("eslint-config-expo/flat.js");

module.exports = [
  expoConfig,
  {
    ignores: ["dist/*"],
  },
];
