// ⚠️ 未使用(Square廃止に伴い隔離)
// paymentValidation の請求先情報チェックと verification details 生成を確認するテスト。
import { buildVerificationDetails } from "../features/payment/paymentValidation";

describe("paymentValidation", () => {
  test("builds Square verification details from billing contact", () => {
    expect(
      buildVerificationDetails(1234, {
        familyName: " 山田 ",
        givenName: " 太郎 ",
        email: "taro@example.com",
      })
    ).toEqual({
      amount: "1234",
      currencyCode: "JPY",
      intent: "CHARGE",
      customerInitiated: true,
      sellerKeyedIn: false,
      billingContact: {
        familyName: "山田",
        givenName: "太郎",
        email: "taro@example.com",
      },
    });
  });

  test("rejects invalid billing contact", () => {
    expect(() =>
      buildVerificationDetails(1234, {
        familyName: "",
        givenName: "太郎",
        email: "invalid",
      })
    ).toThrow("請求先情報が不正です。");
  });
});