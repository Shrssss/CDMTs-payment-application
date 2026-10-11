// stepRules.ts(フッター表示・ボタン無効化・ボタン文言)の全ステップ・全分岐を確認するテスト。
import {
  shouldShowFooter,
  getFooterActionLabel,
  isFooterNextDisabled,
} from "../constants/stepRules";
import { RESERVATION_CONFIG } from "../constants/config";

describe("shouldShowFooter", () => {
  test("フッターを表示するステップ(menu/drink/cart/time)", () => {
    expect(shouldShowFooter("menu")).toBe(true);
    expect(shouldShowFooter("drink")).toBe(true);
    expect(shouldShowFooter("cart")).toBe(true);
    expect(shouldShowFooter("time")).toBe(true);
  });

  test("フッターを表示しないステップ(title/決済系/番号札)", () => {
    expect(shouldShowFooter("title")).toBe(false);
    expect(shouldShowFooter("paymentMethod")).toBe(false);
    expect(shouldShowFooter("payment")).toBe(false);
    expect(shouldShowFooter("paymentPaypay")).toBe(false);
    expect(shouldShowFooter("paymentResult")).toBe(false);
    expect(shouldShowFooter("numberTag")).toBe(false);
  });
});

describe("getFooterActionLabel", () => {
  test("timeステップだけ「注文確定」、それ以外は既定の「次へ」", () => {
    expect(getFooterActionLabel("time")).toBe("注文確定");
    expect(getFooterActionLabel("menu")).toBe("次へ");
    expect(getFooterActionLabel("cart")).toBe("次へ");
    expect(getFooterActionLabel("title")).toBe("次へ");
  });
});

describe("isFooterNextDisabled", () => {
  test("menu: 選択数0なら無効、1以上なら有効", () => {
    expect(isFooterNextDisabled("menu", { numOfChosenMenu: 0 })).toBe(true);
    expect(isFooterNextDisabled("menu", { numOfChosenMenu: 1 })).toBe(false);
  });

  test("drink: 差分が0以外なら無効、0なら有効", () => {
    expect(isFooterNextDisabled("drink", { difference: 1 })).toBe(true);
    expect(isFooterNextDisabled("drink", { difference: -1 })).toBe(true);
    expect(isFooterNextDisabled("drink", { difference: 0 })).toBe(false);
  });

  test("cart: 無効化条件を持たないため常に有効", () => {
    expect(isFooterNextDisabled("cart", {})).toBe(false);
  });

  test("time: 最終受付時刻(RESERVATION_CONFIG)を過ぎていれば無効", () => {
    const beforeCutoff = new Date(2026, 6, 2, RESERVATION_CONFIG.LAST_ORDER_HOUR, 0, 0);
    const atCutoff = new Date(
      2026,
      6,
      2,
      RESERVATION_CONFIG.LAST_ORDER_HOUR,
      RESERVATION_CONFIG.LAST_ORDER_MINUTE,
      0
    );

    expect(isFooterNextDisabled("time", { now: beforeCutoff })).toBe(false);
    // ちょうど最終受付時刻は「受付終了」扱い(reservationSchedule.tsのisPastLastOrderTimeと共有)
    expect(isFooterNextDisabled("time", { now: atCutoff })).toBe(true);
  });

  test("time: nowが渡されない場合は無効化しない", () => {
    expect(isFooterNextDisabled("time", {})).toBe(false);
  });

  test("該当ルールを持たないステップ(title等)は常に有効", () => {
    expect(isFooterNextDisabled("title", {})).toBe(false);
    expect(isFooterNextDisabled("paymentMethod", {})).toBe(false);
  });
});
