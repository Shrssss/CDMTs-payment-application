// MenuPage.tsxの fetchError 分岐(エラー表示 vs 商品グリッド)を確認するテスト。
global.IS_REACT_ACT_ENVIRONMENT = true;

import { act } from "react";
import { createRoot } from "react-dom/client";

import { MenuPage } from "../pages/MenuPage";

describe("MenuPage", () => {
  let container;
  let root;

  const baseProps = {
    prices: { 10: 470, 20: 670, 30: 150, 40: 570, 50: 770 },
    itemNames: { 10: "角煮 単品", 20: "角煮大盛り 単品", 30: "ドリンク 単品", 40: "セット", 50: "大盛りセット" },
    imagePaths: {},
    cart: {},
    addItems: () => {},
    removeItems: () => {},
    isSoldout: {},
    fetchError: false,
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

  test("fetchError=falseの場合、商品グリッドを表示する", () => {
    act(() => {
      root.render(<MenuPage {...baseProps} />);
    });

    expect(container.textContent).toContain("角煮 単品");
    expect(container.textContent).toContain("セット");
    expect(container.textContent).not.toContain("メニューを取得できませんでした");
  });

  test("fetchError=trueの場合、エラー表示に切り替わり商品グリッドは表示しない", () => {
    act(() => {
      root.render(<MenuPage {...baseProps} fetchError={true} />);
    });

    expect(container.textContent).toContain("メニューを取得できませんでした");
    expect(container.textContent).not.toContain("角煮 単品");
  });

  test("onRetryが渡されている場合、再読み込みボタンをクリックするとonRetryが呼ばれる", () => {
    const onRetry = jest.fn();
    act(() => {
      root.render(<MenuPage {...baseProps} fetchError={true} onRetry={onRetry} />);
    });

    const button = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "再読み込み"
    );
    expect(button).toBeDefined();

    act(() => button.click());
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("onRetryが渡されていない場合、再読み込みボタンは表示しない", () => {
    act(() => {
      root.render(<MenuPage {...baseProps} fetchError={true} />);
    });

    expect(container.querySelector("button")).toBeNull();
  });
});
