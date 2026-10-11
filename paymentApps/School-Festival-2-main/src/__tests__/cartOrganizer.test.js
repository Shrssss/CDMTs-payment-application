// cartOrganizer のセット内訳振り分けルールを確認するテスト。
import { organizeCart } from "../features/order/cartOrganizer";

describe("cartOrganizer", () => {
  test("moves drink counts into set and single breakdown slots", () => {
    const result = organizeCart({
      10: 0,
      20: 0,
      30: 0,
      40: 1,
      50: 1,
      91: 3,
      92: 1,
      93: 0,
      94: 0,
      31: 9,
      32: 8,
      41: 7,
      51: 6,
    });

    expect(result).toEqual({
      10: 0,
      20: 0,
      30: 0,
      40: 1,
      50: 1,
      91: 3,
      92: 1,
      93: 0,
      94: 0,
      31: 1,
      32: 1,
      33: 0,
      34: 0,
      41: 1,
      42: 0,
      43: 0,
      44: 0,
      51: 1,
      52: 0,
      53: 0,
      54: 0,
    });
  });
});