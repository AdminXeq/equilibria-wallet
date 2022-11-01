module.exports = {
  root: true,
  parserOptions: {
    parser: "babel-eslint",
    ecmaVersion: 10,
    sourceType: "module"
  },
  env: {
    node: true,
    browser: true,
    es6: true
  },
  extends: [
    "plugin:vue/recommended",
    "esling:recommended",
    "standard"
  ],
  // required to lint *.vue files
  plugins: ["vue"],
  globals: {
    __statics: true,
    __ryo_bin: true
  },
  // add your custom rules here
  rules: {
    "indent": ["error", 4],
    "quotes": ["error", "double"],

    // allow async-await
    "generator-star-spacing": "off",

    // allow paren-less arrow functions
    "arrow-parens": 0,
    "one-var": 0,

    "camelcase": 0,

    "import/first": 0,
    "import/named": 2,
    "import/namespace": 2,
    "import/default": 2,
    "import/export": 2,
    "import/extensions": 0,
    "import/no-unresolved": 0,
    "import/no-extraneous-dependencies": 0,
    "no-extra-boolean-cast": 0,
    "handle-callback-err": 0,

    // allow debugger during development
    "no-debugger": process.env.NODE_ENV === "production" ? 2 : 0,
    "no-fallthrough": { "allowEmptyCase": true }
  }
};
