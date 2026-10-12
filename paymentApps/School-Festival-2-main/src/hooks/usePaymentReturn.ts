import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { getPaymentReturn, readPendingPayment } from "../features/payment/pendingPayment";
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
