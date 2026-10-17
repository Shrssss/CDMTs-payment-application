// localStorage の注文履歴を読み出し、タイトル画面に一覧を出し、選ばれた注文の番号札を復元するフック。
// 履歴は期限切れでも削除しない(表示も残す)。
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { STEPS, type Step } from "../constants/steps";
import { formatDisplayReserved } from "../utils/dateFormat";
import { parseReservedToDate } from "../utils/orderUtils";
import { orderSnapshotKey, readOrderHistory } from "../features/order/orderSnapshot";
import type { AppAction, Goto, OrderSnapshot, PaymentState } from "../types";

export function useOrderSnapshotRestore({
  step,
  dispatch,
  goto,
  setPaymentState,
  setSelectedTime,
}: {
  step: Step | null;
  dispatch: Dispatch<AppAction>;
  goto: Goto;
  setPaymentState: Dispatch<SetStateAction<PaymentState>>;
  setSelectedTime: Dispatch<SetStateAction<string | null>>;
}) {
  const [savedOrders, setSavedOrders] = useState<OrderSnapshot[]>(() => readOrderHistory());

  // タイトルへ戻るたびに読み直し、直前に完了した注文も一覧に出す。
  useEffect(() => {
    if (step === STEPS.TITLE) setSavedOrders(readOrderHistory());
  }, [step]);

  const viewSavedOrder = useCallback((key: string) => {
    const saved = readOrderHistory().find((s) => orderSnapshotKey(s) === key);
    if (!saved) {
      setSavedOrders(readOrderHistory());
      return;
    }

    const { reservedAtIso, createdAt, orderId, itemsCart, displayReserved } = saved;
    const reserved = parseReservedToDate(reservedAtIso, new Date(createdAt));

    // REPLACE_CART は既存カートと合成するため、先に空にして別の注文の商品が混ざらないようにする。
    dispatch({ type: "RESET_CART" });
    dispatch({ type: "REPLACE_CART", cart: itemsCart });
    setSelectedTime(reserved ? reserved.toISOString() : null);
    setPaymentState((prev) => ({
      ...prev,
      outcome: {
        ok: true,
        orderId: orderId || null,
        error: null,
        receiptUrl: null,
        displayReserved: displayReserved || (reserved ? formatDisplayReserved(reserved) : null),
      },
    }));
    goto(STEPS.NUMBER_TAG);
  }, [dispatch, goto, setPaymentState, setSelectedTime]);

  return { savedOrders, viewSavedOrder };
}
