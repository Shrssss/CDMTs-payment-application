// ⚠️ 未使用(Square廃止に伴い隔離)
// paymentGateway の入力検証と決済前提の分岐を確認するテスト。
import { submitPaymentTransaction } from "../features/payment/paymentGateway";

describe("paymentGateway", () => {
  test("rejects missing billing fields before payment is attempted", async () => {
    await expect(
      submitPaymentTransaction({
        orderId: "ORDER-1",
        amount: 470,
        billingInfo: { familyName: "", givenName: "太郎", email: "taro@example.com" },
        useMockPayment: true,
        cardRef: { current: null },
        getSquareConfig: jest.fn(),
        loadSquareSdk: jest.fn(),
        ensurePaymentCardMounted: jest.fn(),
        chargeOrder: jest.fn(),
        buildVerificationDetails: jest.fn(),
      })
    ).rejects.toThrow("氏名とメールアドレスを入力してください。");
  });
});