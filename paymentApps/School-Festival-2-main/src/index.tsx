import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("#root 要素が見つかりません");
}
const root = createRoot(rootElement);

// React アプリを DOM にマウントするエントリーポイント。
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
