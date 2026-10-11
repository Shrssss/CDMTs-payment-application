// ⚠️ 未使用(Square廃止に伴い隔離)
// paymentScreen の初期化処理と Square SDK 読み込みを確認するテスト。
import { initializePaymentScreen } from "../features/payment/paymentScreen";

describe("paymentScreen", () => {
  test("loads square sdk and puts payment screen into input phase", async () => {
    const getSquareConfig = jest.fn().mockResolvedValue({ environment: "SANDBOX" });
    const loadSquareSdk = jest.fn().mockResolvedValue(undefined);
    const setPaymentState = jest.fn();

    await initializePaymentScreen({
      getSquareConfig,
      loadSquareSdk,
      setPaymentState,
      orderId: "ORDER-1",
      createdAtIso: "2026-07-02T12:00:00.000Z",
      useMockPayment: false,
    });

    expect(getSquareConfig).toHaveBeenCalledWith({ useMockPayment: false });
    expect(loadSquareSdk).toHaveBeenCalledWith("SANDBOX");
    expect(setPaymentState).toHaveBeenCalled();
  });

  test("fails closed when square config cannot be retrieved in real mode", async () => {
    const getSquareConfig = jest.fn().mockRejectedValue(new Error("Square設定の取得に失敗しました"));
    const loadSquareSdk = jest.fn().mockResolvedValue(undefined);
    const setPaymentState = jest.fn();

    await expect(
      initializePaymentScreen({
        getSquareConfig,
        loadSquareSdk,
        setPaymentState,
        orderId: "ORDER-1",
        createdAtIso: "2026-07-02T12:00:00.000Z",
        useMockPayment: false,
      })
    ).rejects.toThrow("Square設定の取得に失敗しました");

    expect(loadSquareSdk).not.toHaveBeenCalled();
    expect(setPaymentState).not.toHaveBeenCalled();
  });
});