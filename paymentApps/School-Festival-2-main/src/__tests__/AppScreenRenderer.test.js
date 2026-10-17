// AppScreenRenderer.tsxのルーティング(URL→ページ)が正しいページコンポーネントを
// 描画すること、フッターの表示/非表示、必要な状態がないURLからの戻し先を確認するテスト。
// title/numberTagはsrc/__tests__/orderSnapshotRestore.smoke.test.js(App.tsx経由)で
// 別途カバーされているため、ここでは残り8ステップ(menu/drink/cart/time/
// paymentMethod/payment/paymentPaypay/paymentResult)を確認する。
global.IS_REACT_ACT_ENVIRONMENT = true;

import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router";

import { AppScreenRenderer } from "../AppScreenRenderer";
import { STEP_PATHS } from "../constants/steps";
import { TestAppProvider } from "../test-utils/appContext";

let currentPath;
function LocationProbe() {
  currentPath = useLocation().pathname;
  return null;
}

describe("AppScreenRenderer", () => {
  let container;
  let root;

  // AppContext に入れる値(既定値は test-utils/appContext.tsx)。
  const baseContext = {
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
    calculateDifferenceOfDrinks: () => 0,
    calculateSumInMenu: () => 1,
    calculateSumPrice: () => 0,
    selectedTime: "2026-07-02T13:00:00.000Z",
    setSelectedTime: () => {},
    currentTestTime: false,
    paymentState: { outcome: { ok: false, orderId: null, error: null, receiptUrl: null, displayReserved: null } },
    setPaymentState: () => {},
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
      root.render(
        <MemoryRouter initialEntries={[STEP_PATHS[step]]}>
          <TestAppProvider value={{ ...baseContext, step, ...overrides }}>
            <AppScreenRenderer />
          </TestAppProvider>
          <LocationProbe />
        </MemoryRouter>
      );
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

  test.each([
    ["paymentMethod", "予約時間の選択に戻る", "time"],
    ["payment", "お支払い方法の選択に戻る", "paymentMethod"],
    ["paymentPaypay", "お支払い方法の選択に戻る", "paymentMethod"],
  ])("%s: 戻るボタンで%sへ遷移する(処理中で止まっても抜けられる)", (step, label, target) => {
    const goto = jest.fn();
    renderStep(step, { goto });
    const back = Array.from(container.querySelectorAll("button")).find((b) => b.textContent === label);
    expect(back.disabled).toBe(false);
    act(() => back.click());
    expect(goto).toHaveBeenCalledWith(target);
  });

  test.each(["drink", "cart", "time", "paymentMethod", "payment", "paymentPaypay"])(
    "%s: 商品が選ばれていなければメニューへ戻す",
    (step) => {
      renderStep(step, { calculateSumInMenu: () => 0 });
      expect(currentPath).toBe(STEP_PATHS.menu);
    }
  );

  test.each(["paymentMethod", "payment", "paymentPaypay"])(
    "%s: 予約時刻が未設定なら予約時刻の選択へ戻す",
    (step) => {
      renderStep(step, { selectedTime: null });
      expect(currentPath).toBe(STEP_PATHS.time);
    }
  );

  test("paymentResult: 決済結果がなければタイトルへ戻す", () => {
    renderStep("paymentResult");
    expect(currentPath).toBe(STEP_PATHS.title);
  });

  test("numberTag: 支払済みでなければタイトルへ戻す", () => {
    renderStep("numberTag");
    expect(currentPath).toBe(STEP_PATHS.title);
  });

  test("未知のURLはタイトルへ戻す", () => {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={["/no-such-page"]}>
          <TestAppProvider value={baseContext}>
            <AppScreenRenderer />
          </TestAppProvider>
          <LocationProbe />
        </MemoryRouter>
      );
    });
    expect(currentPath).toBe(STEP_PATHS.title);
    expect(container.textContent).toContain("注文に進む");
  });

  test("title: 「注文に進む」はカートを空にしてから次へ進む", () => {
    const dispatch = jest.fn();
    const next = jest.fn();
    renderStep("title", { dispatch, next });
    const start = Array.from(container.querySelectorAll("button")).find((b) => b.textContent === "注文に進む");
    act(() => start.click());
    expect(dispatch).toHaveBeenCalledWith({ type: "RESET_CART" });
    expect(next).toHaveBeenCalledTimes(1);
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
