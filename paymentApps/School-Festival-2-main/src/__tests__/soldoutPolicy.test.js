// soldoutPolicy の売り切れ連動ルールを確認するテスト。
import { applySoldoutRules } from "../features/soldout/soldoutPolicy";

describe("soldoutPolicy", () => {
  test("applies set link rules from raw soldout values", () => {
    const result = applySoldoutRules({
      10: true,
      20: false,
      91: false,
      92: false,
      93: false,
      94: false,
    });

    expect(result.soldout).toEqual({
      10: true,
      20: false,
      30: false,
      40: true,
      50: false,
      91: false,
      92: false,
      93: false,
      94: false,
    });
  });

  test("applies the large-single -> large-set link independently of the regular-single link", () => {
    const result = applySoldoutRules({
      10: false,
      20: true,
      91: false,
      92: false,
      93: false,
      94: false,
    });

    expect(result.soldout[40]).toBe(false); // 10が売り切れていないのでセットは通常通り
    expect(result.soldout[50]).toBe(true); // 20(大盛り単品)が売り切れなので大盛りセットも売り切れ
  });

  test("does not trigger the all-drinks-sold-out cascade when only some drinks are sold out", () => {
    const result = applySoldoutRules({
      10: false,
      20: false,
      91: true,
      92: true,
      93: true,
      94: false, // 1種類だけ在庫あり
    });

    expect(result.soldout[30]).toBe(false); // ドリンク単品は在庫ありの種類が残っているので売り切れではない
    expect(result.soldout[40]).toBe(false);
    expect(result.soldout[50]).toBe(false);
  });

  test("marks all menu items sold out when every drink is sold out", () => {
    const result = applySoldoutRules({
      10: false,
      20: false,
      91: true,
      92: true,
      93: true,
      94: true,
    });

    expect(result.soldout).toEqual({
      10: false,
      20: false,
      30: true,
      40: true,
      50: true,
      91: true,
      92: true,
      93: true,
      94: true,
    });
  });
});