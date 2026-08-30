// paymentSession の注文作成セッション生成を確認するテスト。
import { createPaymentOrder } from "../features/payment/paymentSession";

describe("paymentSession", () => {
  const cart = {
    10: 1,
    20: 0,
    30: 0,
    40: 0,
    50: 0,
    91: 0,
    92: 0,
    93: 0,
    94: 0,
  };

  test("creates a mock payment order session", async () => {
    const result = await createPaymentOrder({
      cart,
      selectedTime: "2026-07-02T13:00:00.000Z",
      calculateSumPrice: () => 470,
      useMockPayment: true,
      createOrder: jest.fn(),
      createdAtIso: "2026-07-02T12:00:00.000Z",
    });

    expect(result.orderId).toMatch(/^MOCK-/);
    expect(result.reservedAtIso).toBe("2026-07-02T13:00:00.000Z");
    expect(result.amount).toBe(470);
  });
});