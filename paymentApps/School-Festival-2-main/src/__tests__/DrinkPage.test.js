// DrinkPage.tsxの差分メッセージ(あと◯個/OK！/数を減らしてください)の3分岐を確認するテスト。
global.IS_REACT_ACT_ENVIRONMENT = true;

import { act } from "react";
import { createRoot } from "react-dom/client";

import { DrinkPage } from "../pages/DrinkPage";

describe("DrinkPage", () => {
  let container;
  let root;

  const baseProps = {
    itemNames: { 91: "コーラ", 92: "オレンジ", 93: "サイダー", 94: "烏龍茶" },
    imagePaths: {},
    cart: {},
    addItems: () => {},
    removeItems: () => {},
    isSoldout: {},
  };

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.removeChild(container);
    container = null;
  });

  test("difference > 0 のとき「あと◯個」を表示する", () => {
    act(() => {
      root.render(<DrinkPage {...baseProps} difference={2} />);
    });
    expect(container.textContent).toContain("あと 2 個");
  });

  test("difference === 0 のとき「OK！」を表示する", () => {
    act(() => {
      root.render(<DrinkPage {...baseProps} difference={0} />);
    });
    expect(container.textContent).toContain("OK！");
  });

  test("difference < 0 のとき「数を減らしてください」を表示する", () => {
    act(() => {
      root.render(<DrinkPage {...baseProps} difference={-1} />);
    });
    expect(container.textContent).toContain("数を減らしてください");
  });
});
