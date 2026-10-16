// useMockPaymentFlow.ts(useCardPaymentFlow/usePayPayPaymentFlowの共通実体)の
// モック成功パス・未実装エラーパス・不正な予約時刻ガードを確認するテスト。
// USE_MOCK_PAYMENTはモジュール読み込み時に固定される値のため、jest.resetModules()で
// テストごとに読み直す(useMenuItems.test.jsと同じパターン)。
global.IS_REACT_ACT_ENVIRONMENT = true;

import { ORDER_HISTORY_CONFIG } from "../constants/config";

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
    jest.restoreAllMocks();
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

    const saved = JSON.parse(window.localStorage.getItem(ORDER_HISTORY_CONFIG.KEY));
    expect(saved).toHaveLength(1);
    expect(saved[0].orderId).toBe("MOCK-ORDER-1");
    expect(saved[0].itemsCart).toEqual({ 10: 1 });
  });

  test("共通フックの旧実通信分岐は注文作成後も支払済みとして保存しない", async () => {
    process.env.VITE_USE_MOCK_PAYMENT = "false";
    const { Api } = require("../services/apiService");
    const createOrder = jest.spyOn(Api, "createOrder").mockResolvedValue(42);
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
      expect.objectContaining({ ok: false, orderId: 42, error: "カード決済は未実装です" })
    );
    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({
      items: [{ itemId: 10, quantity: 1 }], servingStatus: 0, paymentStatus: false,
    }));

    expect(dispatch).toHaveBeenCalledWith({ type: "GOTO", step: "paymentResult" });
    // 未実装エラーなので、localStorageへは何も保存しない
    expect(window.localStorage.getItem(ORDER_HISTORY_CONFIG.KEY)).toBeNull();
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
