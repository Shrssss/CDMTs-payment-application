import { validateCardEmail } from "../hooks/useCardPaymentFlow";

describe("カード3DS用メール", () => {
  test.each(["", "a+b@example.com", "利用者@example.com", "a@@example.com", "a@example..com", ".a@example.com", "a@example_com", "a @example.com"])("不正な入力を拒否する: %s", (email) => {
    expect(validateCardEmail(email)).not.toBeNull();
  });

  test("仕様に適合するメールを受け付ける", () => {
    expect(validateCardEmail("user_name-1@example.com")).toBeNull();
  });

  test("100バイト境界を検証する", () => {
    const email = `user@${"a".repeat(47)}.${"b".repeat(47)}`;
    expect(email.length).toBe(100);
    expect(validateCardEmail(email)).toBeNull();
    expect(validateCardEmail(`${email}b`)).not.toBeNull();
  });
});
