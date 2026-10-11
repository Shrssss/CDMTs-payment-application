// orderEligibility のメニュー継続条件を確認するテスト。
import { canProceedFromMenu } from "../features/order/orderEligibility";

describe("orderEligibility", () => {
  test("returns false when no menu items are selected", () => {
    expect(
      canProceedFromMenu({
        30: 0,
        40: 0,
        50: 0,
      })
    ).toBe(false);
  });

  test("returns true when at least one menu item is selected", () => {
    expect(
      canProceedFromMenu({
        30: 1,
        40: 0,
        50: 0,
      })
    ).toBe(true);
  });
});