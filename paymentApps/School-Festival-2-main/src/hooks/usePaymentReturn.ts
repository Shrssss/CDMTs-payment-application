import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  clearPaymentReturnParams, clearPendingPayment, getPaymentReturn, readPendingPayment,
  type PendingPayment,
} from "../features/payment/pendingPayment";
import { appendOrderHistory, buildOrderSnapshot } from "../features/order/orderSnapshot";
import { INITIAL_PAYMENT_STATE } from "../constants/initialState";
import { Api } from "../services/apiService";
import { formatDisplayReserved } from "../utils/dateFormat";
import type { AppAction, PaymentState } from "../types";

// 「トップに戻る」時の最終照会の待ち時間上限。通信が返らなくても抜けられることを優先する。
const LEAVE_STATUS_TIMEOUT_MS = 5000;

// 支払済みの保留注文を注文履歴へ追記する。書き込めなければ例外を投げる。
function saveToHistory(pending: PendingPayment): void {
  appendOrderHistory(buildOrderSnapshot({
    createdAtIso: pending.createdAt, reservedAtIso: pending.reservedAtIso,
    orderId: pending.orderId, itemsCart: pending.cart,
    displayReserved: formatDisplayReserved(new Date(pending.reservedAtIso)),
  }));
}

export function usePaymentReturn({ dispatch, setPaymentState, setSelectedTime }: {
  dispatch: Dispatch<AppAction>;
  setPaymentState: Dispatch<SetStateAction<PaymentState>>;
  setSelectedTime: Dispatch<SetStateAction<string | null>>;
}) {
  const [returned] = useState(() => getPaymentReturn(window.location.search, readPendingPayment()));
  const busy = useRef(false);
  const [checking, setChecking] = useState(false);
  const refreshPaymentStatus = useCallback(async () => {
    if (!returned || busy.current) return;
    const { pending } = returned;
    if (!pending) {
      setPaymentState(prev => ({ ...prev, outcome: {
        ok: false, status: "UNRESOLVED", orderId: null, error: returned.error,
        receiptUrl: null, displayReserved: null,
      } }));
      dispatch({ type: "GOTO", step: "paymentResult" });
      return;
    }
    busy.current = true;
    setChecking(true);
    dispatch({ type: "REPLACE_CART", cart: pending.cart });
    setSelectedTime(pending.reservedAtIso);
    const outcome = {
      ok: false, status: "WAITING" as const, orderId: pending.orderId,
      error: returned.error, receiptUrl: null,
      displayReserved: formatDisplayReserved(new Date(pending.reservedAtIso)),
    };
    setPaymentState(prev => ({ ...prev, outcome }));
    dispatch({ type: "GOTO", step: "paymentResult" });
    try {
      const result = await Api.fetchPaymentStatus(pending.orderId);
      if (result.state === "PAID") {
        // 完了保存が失敗した場合は保留データを残し、再読込時に再照会できるようにする。
        try {
          saveToHistory(pending);
          clearPendingPayment();
          clearPaymentReturnParams();
        } catch { /* 支払済みの表示は維持し、保留データから復旧可能にする。 */ }
      }
      setPaymentState(prev => ({ ...prev, outcome: {
        ...outcome, ok: result.state === "PAID", status: result.state,
        error: result.state === "PAID" ? null : returned.error,
      } }));
    } catch {
      setPaymentState(prev => ({ ...prev, outcome: {
        ...outcome, error: "決済状況を取得できませんでした。再決済せず、時間をおいて状況を再確認してください。",
      } }));
    } finally {
      busy.current = false;
      setChecking(false);
    }
  }, [returned, dispatch, setPaymentState, setSelectedTime]);

  // 決済結果の確認画面(WAITING/UNRESOLVED)から抜けてタイトルへ戻る。
  // 保留注文とURLの戻りパラメータを消すので、同じタブで再読込しても結果画面へ戻されない。
  // 抜ける前に1回だけ照会し、支払済みなら注文履歴へ残す。
  // 照会中(再確認ボタンの処理中)でも押せるよう、照会とは別のフラグで二重実行だけ防ぐ。
  const leaving = useRef(false);
  const leavePaymentResult = useCallback(async () => {
    if (leaving.current) return;
    leaving.current = true;
    try {
      const pending = readPendingPayment();
      if (pending) {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          const result = await Promise.race([
            Api.fetchPaymentStatus(pending.orderId),
            new Promise<never>((_, reject) => {
              timer = setTimeout(() => reject(new Error("timeout")), LEAVE_STATUS_TIMEOUT_MS);
            }),
          ]);
          if (result.state === "PAID") saveToHistory(pending);
        } catch { /* 照会・保存できなくても抜けられることを優先する。 */ } finally {
          clearTimeout(timer);
        }
      }
      clearPendingPayment();
      clearPaymentReturnParams();
      setPaymentState(prev => ({ ...prev, outcome: INITIAL_PAYMENT_STATE.outcome }));
      setSelectedTime(null);
      dispatch({ type: "RESET_CART" });
      dispatch({ type: "GOTO", step: "title" });
    } finally {
      leaving.current = false;
    }
  }, [dispatch, setPaymentState, setSelectedTime]);

  useEffect(() => { void refreshPaymentStatus(); }, [refreshPaymentStatus]);
  return { refreshPaymentStatus, leavePaymentResult, checking };
}
