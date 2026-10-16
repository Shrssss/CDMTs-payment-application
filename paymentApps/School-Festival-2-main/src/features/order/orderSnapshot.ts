// 注文内容をlocalStorageの注文履歴へ追記し、一覧として読み出すロジック。
// 履歴は上書き・削除しない(1注文=1要素で増えていくだけ)。
import { ORDER_HISTORY_CONFIG, ORDER_SNAPSHOT_CONFIG } from "../../constants/config";
import { parseReservedToDate } from "../../utils/orderUtils";
import type { Cart, OrderSnapshot } from "../../types";

export function buildOrderSnapshot({
  createdAtIso,
  reservedAtIso,
  orderId,
  itemsCart,
  displayReserved,
}: {
  createdAtIso: string;
  reservedAtIso: string;
  orderId: string | number | null;
  itemsCart: Cart;
  displayReserved: string | null;
}): OrderSnapshot {
  return {
    createdAt: createdAtIso,
    reservedAtIso,
    orderId,
    itemsCart,
    displayReserved,
  };
}

/** 同じ注文かどうかの判定キー。決済戻りの再読込などで同じ注文を二重に積まないために使う。 */
export const orderSnapshotKey = (s: Pick<OrderSnapshot, "orderId" | "createdAt">): string =>
  `${s.orderId}@${s.createdAt}`;

function isValidSnapshot(value: unknown): value is OrderSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const s = value as Record<string, unknown>;
  return (
    (typeof s.orderId === "string" || typeof s.orderId === "number") &&
    typeof s.createdAt === "string" && Number.isFinite(Date.parse(s.createdAt)) &&
    typeof s.reservedAtIso === "string" &&
    parseReservedToDate(s.reservedAtIso, new Date(s.createdAt)) !== null &&
    !!s.itemsCart && typeof s.itemsCart === "object" && !Array.isArray(s.itemsCart) &&
    (s.displayReserved === null || s.displayReserved === undefined || typeof s.displayReserved === "string")
  );
}

function readJSON(key: string): unknown {
  try {
    const s = window.localStorage.getItem(key);
    return s ? JSON.parse(s) : undefined;
  } catch {
    return undefined;
  }
}

/** 保存済みの履歴配列をそのまま読む(壊れた要素も保持したまま返す)。 */
function readRawHistory(): unknown[] {
  const raw = readJSON(ORDER_HISTORY_CONFIG.KEY);
  return Array.isArray(raw) ? raw : [];
}

/**
 * 注文履歴を新しい順で返す。
 * 旧形式(cm_order_v1 の単一スナップショット)が残っていれば一覧に含める。旧キーは消さない。
 * 形の壊れた要素は表示から外すだけで、保存データからは削除しない。
 */
export function readOrderHistory(): OrderSnapshot[] {
  const candidates = [...readRawHistory(), readJSON(ORDER_SNAPSHOT_CONFIG.KEY)];
  const byKey = new Map<string, OrderSnapshot>();
  for (const c of candidates) {
    if (!isValidSnapshot(c)) continue;
    const key = orderSnapshotKey(c);
    if (!byKey.has(key)) byKey.set(key, c);
  }
  return [...byKey.values()].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
}

/**
 * 注文履歴の先頭に1件追記する。同じ注文(orderId+createdAt)が既にあればその要素だけ差し替える。
 * 書き込めない場合は例外を投げる(呼び出し側が保留注文を残すかどうかの判定に使う)。
 */
export function appendOrderHistory(snapshot: OrderSnapshot): void {
  const key = orderSnapshotKey(snapshot);
  const rest = readRawHistory().filter(
    (s) => !(isValidSnapshot(s) && orderSnapshotKey(s) === key)
  );
  window.localStorage.setItem(ORDER_HISTORY_CONFIG.KEY, JSON.stringify([snapshot, ...rest]));
}
