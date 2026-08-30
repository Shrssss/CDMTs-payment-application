// 注文内容をlocalStorageに保存し、復元や期限判定を行うロジック。
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

export function clearOrderSnapshot(
  removeItem: (key: string) => void,
  storageKey: string
): void {
  removeItem(storageKey);
}

export function isReservationExpired(
  reservedDate: Date,
  now: Date,
  validDurationMs: number
): boolean {
  return now.getTime() - reservedDate.getTime() > validDurationMs;
}
