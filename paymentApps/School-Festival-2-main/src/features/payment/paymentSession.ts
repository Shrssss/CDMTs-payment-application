// 注文作成に必要な入力をまとめ、支払いセッションの前提を作るロジック。
// 決済手段(Square/PayPay/PaySys等)に依存しない汎用ロジック。
// 現在、実際に呼び出しているアクティブな画面はない(カード・PayPayともに
// PaySysモックへ一本化されたため)。将来PaySysの実装を行う際の参考として残す。
import { buildOrderItems, parseReservedToDate } from "../../utils/orderUtils";
import { toLocalDateTimeString } from "../../utils/dateFormat";
import type { Cart } from "../../types";

const generateMockOrderId = (): string => "MOCK-" + Math.floor(Math.random() * 100000);

export type CreateOrderFn = (args: {
  items: { itemId: number; quantity: number }[];
  drinkCounts: Record<number, number>;
  orderDate: string;
  reservedTime: string;
}) => Promise<string | number>;

export interface CreatePaymentOrderParams {
  cart: Cart;
  selectedTime: string | null;
  calculateSumPrice: () => number;
  useMockPayment: boolean;
  createOrder: CreateOrderFn;
  createdAtIso?: string;
}

export async function createPaymentOrder({
  cart,
  selectedTime,
  calculateSumPrice,
  useMockPayment,
  createOrder,
  createdAtIso = new Date().toISOString(),
}: CreatePaymentOrderParams) {
  const { items, drinkCounts } = buildOrderItems(cart);
  if (items.length === 0) throw new Error("カートが空です");

  const reservedDate = parseReservedToDate(selectedTime);
  if (!reservedDate) throw new Error("予約時刻が不正です");

  const amount = calculateSumPrice();
  const reservedAtIso = reservedDate.toISOString();

  let orderId: string | number;
  if (useMockPayment) {
    orderId = generateMockOrderId();
  } else {
    const orderDateLocal = toLocalDateTimeString(new Date(createdAtIso));
    const reservedLocal = toLocalDateTimeString(reservedDate);
    const orderResp = await createOrder({
      items,
      drinkCounts,
      orderDate: orderDateLocal,
      reservedTime: reservedLocal,
    });
    orderId = orderResp;
    if (!orderId) {
      throw new Error("注文作成に失敗しました (orderId 未取得)");
    }
  }

  return {
    orderId,
    createdAtIso,
    reservedDate,
    reservedAtIso,
    items,
    drinkCounts,
    amount,
  };
}
