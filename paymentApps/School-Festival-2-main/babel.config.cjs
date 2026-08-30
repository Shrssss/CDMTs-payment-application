// Jest(babel-jest)専用のBabel設定。Vite自体のビルド・devサーバーはesbuildを使うため
// この設定を経由しない。テスト実行時のTS/JSXのトランスパイルのみに使う。
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-typescript",
  ],
  // import.meta.env.VITE_X (Viteの仕組み) を process.env.VITE_X に変換し、
  // Jest(Node)環境でも同じコードがそのまま動くようにする。
  plugins: ["babel-plugin-transform-vite-meta-env"],
  // @babel/preset-react(JSX構文プラグイン)は .ts 以外の全てに適用する
  // (.jsx/.tsx はもちろんJSXを含むが、.test.js もJSXを含むテストがあるため)。
  // .ts だけは除外する: 総称アロー関数(例: <T = unknown>(x) => ...)がJSXの
  // 開始タグと誤認識されてパースエラーになるため、.ts にはJSX構文を有効化しない。
  overrides: [
    {
      test: /\.(jsx|tsx|js)$/,
      presets: [["@babel/preset-react", { runtime: "automatic" }]],
    },
  ],
};
