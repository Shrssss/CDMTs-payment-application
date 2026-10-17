// バックエンドから照合ID(SID)で復元した注文を、画面表示・注文履歴向けに変換する。
import { appendOrderHistory, buildOrderSnapshot } from "../order/orderSnapshot";
import { formatDisplayReserved } from "../../utils/dateFormat";
import type { PaymentReturnOrder } from "../../types";

/** 受取予定日時(バックエンドの値はタイムゾーンなしのため、端末の時刻として解釈する)。 */
export const reservedDateOf = (order: PaymentReturnOrder): Date => new Date(order.reservedAt);

// 支払済みの注文を注文履歴へ追記する。書き込めなければ例外を投げる。
export function saveReturnOrderToHistory(order: PaymentReturnOrder): void {
  const reserved = reservedDateOf(order);
  appendOrderHistory(buildOrderSnapshot({
    createdAtIso: new Date(order.createdAt).toISOString(),
    reservedAtIso: reserved.toISOString(),
    orderId: order.orderId,
    itemsCart: order.cart,
    displayReserved: formatDisplayReserved(reserved),
  }));
}
