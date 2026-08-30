// PaymentResultPage.tsxの成功/失敗分岐、receiptUrl/orderIdの有無による表示差分、
// ボタン操作を確認するテスト。
global.IS_REACT_ACT_ENVIRONMENT = true;

import { act } from "react";
import { createRoot } from "react-dom/client";

import { PaymentResultPage } from "../pages/PaymentResultPage";

describe("PaymentResultPage", () => {
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
    container = null;
  });

  const render = (paymentState, extra = {}) => {
    const dispatch = jest.fn();
    const setPaymentState = jest.fn();
    act(() => {
      root.render(
        <PaymentResultPage
          paymentState={paymentState}
          selectedTime={null}
          setPaymentState={setPaymentState}
          dispatch={dispatch}
          {...extra}
        />
      );
    });
    return { dispatch, setPaymentState };
  };

  test("成功時: 注文番号を表示し、receiptUrlがあればレシートリンクを表示する", () => {
    render({
      outcome: {
        ok: true,
        orderId: "ORDER-123",
        error: null,
        receiptUrl: "https://example.com/receipt",
        displayReserved: "12:30",
      },
    });

    expect(container.textContent).toContain("決済が完了しました");
    expect(container.textContent).toContain("ORDER-123");
    const link = container.querySelector("a");
    expect(link).not.toBeNull();
    expect(link.href).toBe("https://example.com/receipt");
  });

  test("成功時: receiptUrlがなければレシートリンクを表示しない", () => {
    render({
      outcome: { ok: true, orderId: "ORDER-123", error: null, receiptUrl: null, displayReserved: "12:30" },
    });

    expect(container.querySelector("a")).toBeNull();
  });

  test("成功時: 「番号札を表示」ボタンでnumberTagへ遷移する", () => {
    const { dispatch } = render({
      outcome: { ok: true, orderId: "ORDER-123", error: null, receiptUrl: null, displayReserved: "12:30" },
    });

    const button = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "番号札を表示"
    );
    act(() => button.click());

    expect(dispatch).toHaveBeenCalledWith({ type: "GOTO", step: "numberTag" });
  });

  test("失敗時: orderIdがあれば予約時刻を表示する(現状のモック実装では未到達だが、" +
    "PaySys実装後に「注文作成後・課金失敗」の状態で使われる想定の分岐)", () => {
    render({
      outcome: { ok: false, orderId: "ORDER-1", error: "エラー文言", receiptUrl: null, displayReserved: "13:00" },
    });
    expect(container.textContent).toContain("予約時刻");
    expect(container.textContent).toContain("13:00");
    expect(container.textContent).toContain("エラー文言");
  });

  test("失敗時: orderIdがなければ予約時刻を表示しない(現状のモック実装で実際に通る経路)", () => {
    render({ outcome: { ok: false, orderId: null, error: "エラー文言", receiptUrl: null, displayReserved: null } });
    expect(container.textContent).not.toContain("予約時刻");
  });

  test("失敗時: errorがnullの場合は「不明なエラー」を表示する", () => {
    render({ outcome: { ok: false, orderId: null, error: null, receiptUrl: null, displayReserved: null } });
    expect(container.textContent).toContain("不明なエラー");
  });

  test("失敗時: 「カートに戻る」でoutcomeをリセットしcartへ、「再試行」でpaymentへ遷移する", () => {
    const { dispatch, setPaymentState } = render({
      outcome: { ok: false, orderId: null, error: "err", receiptUrl: null, displayReserved: null },
    });

    const backButton = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "カートに戻る"
    );
    act(() => backButton.click());
    expect(dispatch).toHaveBeenCalledWith({ type: "GOTO", step: "cart" });
    expect(setPaymentState).toHaveBeenCalledTimes(1);

    const retryButton = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "再試行"
    );
    act(() => retryButton.click());
    expect(dispatch).toHaveBeenCalledWith({ type: "GOTO", step: "payment" });
    expect(setPaymentState).toHaveBeenCalledTimes(2);

    // resetOutcomeが渡すupdater関数が、outcomeを未実行状態に戻すことを確認
    const updater = setPaymentState.mock.calls[0][0];
    const result = updater({ billingInfo: {}, outcome: { ok: true, orderId: "X", error: null, receiptUrl: null, displayReserved: null } });
    expect(result.outcome).toEqual({ ok: false, orderId: null, error: null, receiptUrl: null, displayReserved: null });
  });
});
