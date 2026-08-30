// useMockPaymentFlow.ts(useCardPaymentFlow/usePayPayPaymentFlowの共通実体)の
// モック成功パス・未実装エラーパス・不正な予約時刻ガードを確認するテスト。
// USE_MOCK_PAYMENTはモジュール読み込み時に固定される値のため、jest.resetModules()で
// テストごとに読み直す(useMenuItems.test.jsと同じパターン)。
global.IS_REACT_ACT_ENVIRONMENT = true;

import { ORDER_SNAPSHOT_CONFIG } from "../constants/config";

describe("useMockPaymentFlow", () => {
  const originalEnv = { ...process.env };
  let container;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    window.localStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
    process.env = originalEnv;
  });

  const renderAndSubmit = async (params) => {
    const React = require("react");
    const { createRoot } = require("react-dom/client");
    const { act } = React;
    const { useMockPaymentFlow } = require("../hooks/useMockPaymentFlow");

    let captured;
    function Harness() {
      captured = useMockPaymentFlow(params);
      return null;
    }

    await act(async () => {
      createRoot(container).render(React.createElement(Harness));
    });
    await act(async () => {
      await captured.handlePay();
    });

    return captured;
  };

  test("モックオンの場合、注文成功として扱いスナップショットを保存する", async () => {
    process.env.VITE_USE_MOCK_PAYMENT = "true";
    const dispatch = jest.fn();
    const setPaymentState = jest.fn();

    await renderAndSubmit({
      cart: { 10: 1 },
      selectedTime: "12:30",
      dispatch,
      setPaymentState,
      mockOrderId: "MOCK-ORDER-1",
      notImplementedMessage: "未実装です",
    });

    expect(setPaymentState).toHaveBeenCalledTimes(1);
    const updater = setPaymentState.mock.calls[0][0];
    const result = updater({
      outcome: { ok: false, orderId: null, error: null, receiptUrl: null, displayReserved: null },
    });
    expect(result.outcome).toEqual(
      expect.objectContaining({ ok: true, orderId: "MOCK-ORDER-1", error: null })
    );

    expect(dispatch).toHaveBeenCalledWith({ type: "GOTO", step: "paymentResult" });

    const saved = JSON.parse(window.localStorage.getItem(ORDER_SNAPSHOT_CONFIG.KEY));
    expect(saved.orderId).toBe("MOCK-ORDER-1");
    expect(saved.itemsCart).toEqual({ 10: 1 });
  });

  test("モックオフの場合、未実装エラーを返しバックエンドへは接続しない", async () => {
    process.env.VITE_USE_MOCK_PAYMENT = "false";
    const dispatch = jest.fn();
    const setPaymentState = jest.fn();

    await renderAndSubmit({
      cart: { 10: 1 },
      selectedTime: "12:30",
      dispatch,
      setPaymentState,
      mockOrderId: "MOCK-ORDER-1",
      notImplementedMessage: "カード決済は未実装です",
    });

    const updater = setPaymentState.mock.calls[0][0];
    const result = updater({
      outcome: { ok: false, orderId: null, error: null, receiptUrl: null, displayReserved: null },
    });
    expect(result.outcome).toEqual(
      expect.objectContaining({ ok: false, orderId: null, error: "カード決済は未実装です" })
    );

    expect(dispatch).toHaveBeenCalledWith({ type: "GOTO", step: "paymentResult" });
    // 未実装エラーなので、localStorageへは何も保存しない
    expect(window.localStorage.getItem(ORDER_SNAPSHOT_CONFIG.KEY)).toBeNull();
  });

  test("予約時刻が不正な場合はalertを出して何もせず終了する", async () => {
    process.env.VITE_USE_MOCK_PAYMENT = "true";
    const dispatch = jest.fn();
    const setPaymentState = jest.fn();
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

    await renderAndSubmit({
      cart: { 10: 1 },
      selectedTime: null,
      dispatch,
      setPaymentState,
      mockOrderId: "MOCK-ORDER-1",
      notImplementedMessage: "未実装です",
    });

    expect(alertSpy).toHaveBeenCalledWith("予約時刻が不正です");
    expect(setPaymentState).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
