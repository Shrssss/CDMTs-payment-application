// orderSnapshot の Cookie 用データ生成と復元判定を確認するテスト。
// 予約日時のパース(parseReservedToDate)はsrc/utils/orderUtils.tsに統合したため、
// そちらのテスト(orderUtils.test.js)を参照。
import { buildOrderSnapshot, isReservationExpired } from "../features/order/orderSnapshot";

describe("orderSnapshot", () => {
  test("builds a cookie snapshot payload", () => {
    expect(
      buildOrderSnapshot({
        createdAtIso: "2026-07-02T12:00:00.000Z",
        reservedAtIso: "2026-07-02T13:00:00.000Z",
        orderId: "ORDER-1",
        itemsCart: { 10: 1 },
        displayReserved: "2026-07-02 13:00",
      })
    ).toEqual({
      createdAt: "2026-07-02T12:00:00.000Z",
      reservedAtIso: "2026-07-02T13:00:00.000Z",
      orderId: "ORDER-1",
      itemsCart: { 10: 1 },
      displayReserved: "2026-07-02 13:00",
    });
  });

  test("detects expired reservation snapshots", () => {
    const reserved = new Date(2026, 6, 2, 12, 0, 0);
    const now = new Date(2026, 6, 2, 13, 1, 0);

    expect(isReservationExpired(reserved, now, 60 * 60 * 1000)).toBe(true);
  });

  test("does not treat a still-valid reservation as expired (including the exact boundary)", () => {
    const reserved = new Date(2026, 6, 2, 12, 0, 0);
    const validDurationMs = 60 * 60 * 1000;

    // 期限内
    expect(isReservationExpired(reserved, new Date(2026, 6, 2, 12, 30, 0), validDurationMs)).toBe(
      false
    );
    // ちょうど期限ぴったり(経過時間 === validDurationMs)はまだ期限切れではない(">"判定のため)
    expect(
      isReservationExpired(reserved, new Date(reserved.getTime() + validDurationMs), validDurationMs)
    ).toBe(false);
  });
});