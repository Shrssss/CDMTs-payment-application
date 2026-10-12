import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { getPaymentReturn, readPendingPayment, PENDING_PAYMENT_KEY } from "../features/payment/pendingPayment";
import { ORDER_SNAPSHOT_CONFIG } from "../constants/config";
import { buildOrderSnapshot } from "../features/order/orderSnapshot";
import { Api } from "../services/apiService";
import { formatDisplayReserved } from "../utils/dateFormat";
import type { AppAction, PaymentState } from "../types";

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
          localStorage.setItem(ORDER_SNAPSHOT_CONFIG.KEY, JSON.stringify(buildOrderSnapshot({
            createdAtIso: pending.createdAt, reservedAtIso: pending.reservedAtIso,
            orderId: pending.orderId, itemsCart: pending.cart, displayReserved: outcome.displayReserved,
          })));
          sessionStorage.removeItem(PENDING_PAYMENT_KEY);
          const url = new URL(window.location.href);
          ["paysys_return", "result", "SID", "ERROR"].forEach(key => url.searchParams.delete(key));
          window.history.replaceState(null, "", url.pathname + url.search + url.hash);
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

  useEffect(() => { void refreshPaymentStatus(); }, [refreshPaymentStatus]);
  return { refreshPaymentStatus, checking };
}
