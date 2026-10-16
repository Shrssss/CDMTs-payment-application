// orderSnapshot の注文データ生成と、localStorage 注文履歴(追記のみ・削除しない)を確認するテスト。
// 予約日時のパース(parseReservedToDate)はsrc/utils/orderUtils.tsに統合したため、
// そちらのテスト(orderUtils.test.js)を参照。
import {
  appendOrderHistory,
  buildOrderSnapshot,
  readOrderHistory,
} from "../features/order/orderSnapshot";
import { ORDER_HISTORY_CONFIG, ORDER_SNAPSHOT_CONFIG } from "../constants/config";

const snap = (orderId, createdAt, extra = {}) => ({
  createdAt,
  reservedAtIso: "2026-07-02T13:00:00.000Z",
  orderId,
  itemsCart: { 10: 1 },
  displayReserved: "2026-07-02 22:00",
  ...extra,
});

describe("orderSnapshot", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => jest.restoreAllMocks());

  test("builds a snapshot payload", () => {
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

  test("履歴は上書きせず追記し、新しい順に返す", () => {
    appendOrderHistory(snap(1, "2026-07-02T10:00:00.000Z"));
    appendOrderHistory(snap(2, "2026-07-02T11:00:00.000Z"));
    appendOrderHistory(snap(3, "2026-07-02T12:00:00.000Z"));

    expect(readOrderHistory().map((s) => s.orderId)).toEqual([3, 2, 1]);
    expect(JSON.parse(window.localStorage.getItem(ORDER_HISTORY_CONFIG.KEY))).toHaveLength(3);
  });

  test("同じ注文(orderId+createdAt)の再保存は1件にまとめ、別の注文は残す", () => {
    appendOrderHistory(snap(1, "2026-07-02T10:00:00.000Z"));
    appendOrderHistory(snap(2, "2026-07-02T11:00:00.000Z"));
    appendOrderHistory(snap(1, "2026-07-02T10:00:00.000Z", { displayReserved: "updated" }));

    const history = readOrderHistory();
    expect(history.map((s) => s.orderId)).toEqual([2, 1]);
    expect(history[1].displayReserved).toBe("updated");
  });

  test("旧キー(cm_order_v1)の1件も一覧に含め、旧キーは消さない", () => {
    const legacy = snap("OLD", "2026-07-01T10:00:00.000Z");
    window.localStorage.setItem(ORDER_SNAPSHOT_CONFIG.KEY, JSON.stringify(legacy));
    appendOrderHistory(snap(5, "2026-07-02T10:00:00.000Z"));

    expect(readOrderHistory().map((s) => s.orderId)).toEqual([5, "OLD"]);
    expect(window.localStorage.getItem(ORDER_SNAPSHOT_CONFIG.KEY)).not.toBeNull();
  });

  test("壊れた要素は表示から外すが、保存データからは消さない", () => {
    window.localStorage.setItem(
      ORDER_HISTORY_CONFIG.KEY,
      JSON.stringify([{ broken: true }, snap(1, "2026-07-02T10:00:00.000Z")])
    );
    expect(readOrderHistory().map((s) => s.orderId)).toEqual([1]);

    appendOrderHistory(snap(2, "2026-07-02T11:00:00.000Z"));
    expect(JSON.parse(window.localStorage.getItem(ORDER_HISTORY_CONFIG.KEY))).toHaveLength(3);
  });

  test("履歴キーが壊れたJSONでも読み出しは空配列になる", () => {
    window.localStorage.setItem(ORDER_HISTORY_CONFIG.KEY, "{");
    expect(readOrderHistory()).toEqual([]);
  });

  test("書き込めない場合は例外を投げる", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("full");
    });
    expect(() => appendOrderHistory(snap(1, "2026-07-02T10:00:00.000Z"))).toThrow("full");
  });
});
