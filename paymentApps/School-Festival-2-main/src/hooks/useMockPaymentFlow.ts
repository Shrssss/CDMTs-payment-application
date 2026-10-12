// 方式別フックからモック有効時に使う共通処理。旧注文作成のみの分岐は互換のため保持。
import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

import { ORDER_SNAPSHOT_CONFIG, USE_MOCK_PAYMENT } from "../constants/config";
import { buildOrderSnapshot } from "../features/order/orderSnapshot";
import { formatDisplayReserved } from "../utils/dateFormat";
import { setLocalStorageJSON } from "../utils/localStorage";
import { parseReservedToDate, buildOrderItems } from "../utils/orderUtils";
import type { AppAction, Cart, PaymentState, } from "../types";
import { Api } from "../services/apiService";
import { toLocalDateTimeString } from "../utils/dateFormat";


export interface UseMockPaymentFlowParams {
  cart: Cart;
  selectedTime: string | null;
  dispatch: Dispatch<AppAction>;
  setPaymentState: Dispatch<SetStateAction<PaymentState>>;
  // paymentMethod: PaymentMethod;
  /** USE_MOCK_PAYMENTがオンの場合に使う決め打ちの注文ID(決済手段ごとに異なる)。 */
  mockOrderId: string;
  /** USE_MOCK_PAYMENTがオフの場合に表示するエラー文言(決済手段ごとに異なる)。 */
  notImplementedMessage: string;
}

export function useMockPaymentFlow({
  cart,
  selectedTime,
  dispatch,
  setPaymentState,
  // paymentMethod,
  mockOrderId,
  notImplementedMessage,
}: UseMockPaymentFlowParams) {
  const [submitting, setSubmitting] = useState(false);

  const handlePay = useCallback(async () => {
    const reservedDate = parseReservedToDate(selectedTime);
    if (!reservedDate) {
      alert("予約時刻が不正です");
      return;
    }

    setSubmitting(true);
    const createdAtIso = new Date().toISOString();
    const reservedAtIso = reservedDate.toISOString();
    const displayReserved = formatDisplayReserved(reservedDate);

    try {
    if (USE_MOCK_PAYMENT) {
      setLocalStorageJSON(
        ORDER_SNAPSHOT_CONFIG.KEY,
        buildOrderSnapshot({
          createdAtIso,
          reservedAtIso,
          orderId: mockOrderId,
          itemsCart: cart,
          displayReserved,
        })
      );
      setPaymentState((prev) => ({
        ...prev,
        outcome: {
          ok: true,
          orderId: mockOrderId,
          error: null,
          receiptUrl: null,
          displayReserved,
        },
      }));

    } else {
        const orderId = await Api.createOrder(
          {
            items: buildOrderItems(cart).items,
            orderDate: toLocalDateTimeString(new Date(createdAtIso)),
            reservedTime: toLocalDateTimeString(reservedDate),
            servingStatus: 0,
            paymentStatus: false,
          }
        )

      setPaymentState((prev) => ({
        ...prev,
        outcome: {
          ok: false,
          orderId: orderId,
          error: notImplementedMessage,
          receiptUrl: null,
          displayReserved,
        },
      }));
    }} catch (error) {
      console.error("Error 注文作成に失敗しました:", error);

      setPaymentState((prev) => ({
        ...prev,
        outcome: {
          ok: false,
          orderId: null,
          error: "注文作成に失敗しました: ",
          receiptUrl: null,
          displayReserved,
        },
      }));

    } finally {
        setSubmitting(false);

    }
    dispatch({ type: "GOTO", step: "paymentResult" });
  }, [cart, selectedTime, dispatch, setPaymentState, mockOrderId, notImplementedMessage]);

  return { handlePay, submitting };
}
