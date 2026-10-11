// AppScreenRenderer.tsxのrenderPageスイッチの各分岐が正しいページコンポーネントを
// 描画すること、フッターの表示/非表示が切り替わることを確認するテスト。
// title/numberTagはsrc/__tests__/orderSnapshotRestore.smoke.test.js(App.tsx経由)で
// 別途カバーされているため、ここでは残り8ステップ(menu/drink/cart/time/
// paymentMethod/payment/paymentPaypay/paymentResult)を確認する。
global.IS_REACT_ACT_ENVIRONMENT = true;

import { act } from "react";
import { createRoot } from "react-dom/client";

import { AppScreenRenderer } from "../AppScreenRenderer";

describe("AppScreenRenderer", () => {
  let container;
  let root;

  const baseProps = {
    next: () => {},
    prev: () => {},
    cart: {},
    addItems: () => {},
    removeItems: () => {},
    prices: { 10: 470 },
    itemNames: { 10: "角煮 単品" },
    imagePaths: {},
    isSoldout: {},
    menuFetchError: false,
    onRetryMenuFetch: () => {},
    calculateDifferenceOfDrinks: () => 0,
    calculateSumInMenu: () => 0,
    calculateSumPrice: () => 0,
    selectedTime: null,
    setSelectedTime: () => {},
    currentTestTime: false,
    paymentState: { outcome: { ok: false, orderId: null, error: null, receiptUrl: null, displayReserved: null } },
    setPaymentState: () => {},
    dispatch: () => {},
    onOpenLegalNotice: () => {},
    hasSavedOrder: false,
    onViewSavedOrder: () => {},
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

  const renderStep = (step, overrides = {}) => {
    act(() => {
      root.render(<AppScreenRenderer {...baseProps} step={step} {...overrides} />);
    });
  };

  test("menu: MenuPageを描画し、フッターを表示する", () => {
    renderStep("menu");
    expect(container.textContent).toContain("角煮 単品");
    expect(container.textContent).toContain("次へ"); // フッターのボタン文言
  });

  test("drink: DrinkPageを描画し、フッターを表示する", () => {
    renderStep("drink", { calculateDifferenceOfDrinks: () => 0 });
    expect(container.textContent).toContain("飲み物を選択してください");
    expect(container.textContent).toContain("次へ");
  });

  test("cart: CartPageを描画し、フッターを表示する", () => {
    renderStep("cart");
    expect(container.textContent).toContain("ご注文内容の確認");
    expect(container.textContent).toContain("次へ");
  });

  test("time: TimePageを描画し、フッターに「注文確定」を表示する", () => {
    // currentTestTime=falseだと実時刻依存になり、実行時刻によっては受付終了後の
    // 表示になってテストが不安定になるため、固定の時刻を明示的に渡す。
    renderStep("time", { currentTestTime: new Date(2026, 6, 2, 12, 0, 0) });
    expect(container.textContent).toContain("予約時刻確認");
    expect(container.textContent).toContain("注文確定");
  });

  test("paymentMethod: PaymentMethodPageを描画し、フッターは表示しない", () => {
    renderStep("paymentMethod");
    expect(container.textContent).toContain("お支払い方法を選択してください");
    expect(container.querySelector("footer")).toBeNull();
  });

  test("payment: PaymentPageを描画し、フッターは表示しない", () => {
    renderStep("payment");
    expect(container.textContent).toContain("クレジットカードでのお支払い");
    expect(container.querySelector("footer")).toBeNull();
  });

  test("paymentPaypay: PaymentPayPayPageを描画し、フッターは表示しない", () => {
    renderStep("paymentPaypay");
    expect(container.textContent).toContain("PayPayでのお支払い");
    expect(container.querySelector("footer")).toBeNull();
  });

  test("paymentResult: PaymentResultPageを描画し、フッターは表示しない", () => {
    renderStep("paymentResult", {
      paymentState: {
        outcome: { ok: true, orderId: "ORDER-1", error: null, receiptUrl: null, displayReserved: null },
      },
    });
    expect(container.textContent).toContain("決済が完了しました");
    expect(container.querySelector("footer")).toBeNull();
  });

  test("フッターのnextクリックでnext()が呼ばれる(cartステップ)", () => {
    const next = jest.fn();
    renderStep("cart", { next });

    const nextButton = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "次へ"
    );
    act(() => nextButton.click());

    expect(next).toHaveBeenCalledTimes(1);
  });
});
