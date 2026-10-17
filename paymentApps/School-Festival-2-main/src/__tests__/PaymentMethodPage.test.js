// PaymentMethodPage.tsx の決済方法ボタンと、保存機能が使えない環境での案内を確認するテスト。
global.IS_REACT_ACT_ENVIRONMENT = true;

import { act } from "react";
import { createRoot } from "react-dom/client";

import { PaymentMethodPage } from "../pages/PaymentMethodPage";
import { STORAGE_UNAVAILABLE_MESSAGE } from "../features/payment/pendingPayment";
import { TestAppProvider } from "../test-utils/appContext";

// 実際の決済(モックなし)での挙動を確かめる。
jest.mock("../constants/config", () => ({ ...jest.requireActual("../constants/config"), USE_MOCK_PAYMENT: false }));

describe("PaymentMethodPage", () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.removeChild(container);
    jest.restoreAllMocks();
  });

  const render = (goto = jest.fn()) => {
    act(() => {
      root.render(
        <TestAppProvider value={{ goto }}>
          <PaymentMethodPage />
        </TestAppProvider>
      );
    });
    return goto;
  };
  const buttonByText = (text) => Array.from(container.querySelectorAll("button")).find((b) => b.textContent === text);

  test("保存できる環境では案内を出さず、各決済画面へ進める", () => {
    const goto = render();
    expect(container.textContent).not.toContain(STORAGE_UNAVAILABLE_MESSAGE);
    act(() => buttonByText("クレジットカードで支払う").click());
    act(() => buttonByText("PayPayで支払う").click());
    expect(goto).toHaveBeenCalledWith("payment");
    expect(goto).toHaveBeenCalledWith("paymentPaypay");
  });

  test("localStorageに書き込めない環境では案内を出し、決済ボタンを押せなくする(戻るは押せる)", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    const goto = render();
    expect(container.querySelector('[role="alert"]').textContent).toBe(STORAGE_UNAVAILABLE_MESSAGE);
    expect(buttonByText("クレジットカードで支払う").disabled).toBe(true);
    expect(buttonByText("PayPayで支払う").disabled).toBe(true);
    act(() => buttonByText("予約時間の選択に戻る").click());
    expect(goto).toHaveBeenCalledWith("time");
  });
});
