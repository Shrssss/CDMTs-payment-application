// react-scripts(CRA)の廃止に伴い新設したJest単体設定。
// Vite(devサーバー・本番ビルド)とは独立して、テストのみJest+Babelで実行する。
module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "<rootDir>/src/test-utils/styleMock.cjs",
    "\\.(jpg|jpeg|png|gif|svg|webp)$": "<rootDir>/src/test-utils/fileMock.cjs",
  },
};
