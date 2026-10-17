import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  clearPaymentReturnParams, clearPendingPayment, getPaymentReturn, readPendingPayment,
  type PendingPayment,
} from "../features/payment/pendingPayment";
import { appendOrderHistory, buildOrderSnapshot } from "../features/order/orderSnapshot";
import { INITIAL_PAYMENT_STATE } from "../constants/initialState";
import { Api } from "../services/apiService";
import { formatDisplayReserved } from "../utils/dateFormat";
import type { AppAction, Goto, PaymentState } from "../types";

// 「トップに戻る」時の最終照会の待ち時間上限。通信が返らなくても抜けられることを優先する。
const LEAVE_STATUS_TIMEOUT_MS = 5000;

function returnSid(search: string): string | null {
  const params = new URLSearchParams(search);
  const sid = params.get("return_sid");
  if (sid && /^[0-9a-f]{16}$/.test(sid)) return sid;
  const gatewaySid = params.get("SID");
  return gatewaySid && /^[0-9a-f]{16}$/.test(gatewaySid) ? gatewaySid : null;
}

// 支払済みの保留注文を注文履歴へ追記する。書き込めなければ例外を投げる。
function saveToHistory(pending: PendingPayment): void {
  appendOrderHistory(buildOrderSnapshot({
    createdAtIso: pending.createdAt, reservedAtIso: pending.reservedAtIso,
    orderId: pending.orderId, itemsCart: pending.cart,
    displayReserved: formatDisplayReserved(new Date(pending.reservedAtIso)),
  }));
}

export function usePaymentReturn({ dispatch, goto, setPaymentState, setSelectedTime }: {
  dispatch: Dispatch<AppAction>;
  goto: Goto;
  setPaymentState: Dispatch<SetStateAction<PaymentState>>;
  setSelectedTime: Dispatch<SetStateAction<string | null>>;
}) {
  const [returned, setReturned] = useState(() => {
    const pending = readPendingPayment();
    const sid = returnSid(window.location.search);
    return sid && pending?.sid !== sid ? null : getPaymentReturn(window.location.search, pending);
  });

  useEffect(() => {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    const sid = returnSid(search);
    if (!sid || readPendingPayment()?.sid === sid) return;
    let active = true;
    void Api.fetchPaymentReturnOrder(sid).then(order => {
      const method = params.get("paysys_return");
      if (method && method !== "card" && method !== "paypay") throw new Error("決済方式が不正です。");
      const pending: PendingPayment = {
        orderId: order.orderId, sid, method: method === "card" ? "card" : "paypay", cart: order.cart,
        createdAt: new Date(order.createdAt).toISOString(),
        reservedAtIso: new Date(order.reservedAt).toISOString(),
      };
      if (active) setReturned(getPaymentReturn(search, pending));
    }).catch(() => {
      if (active) setReturned(getPaymentReturn(search, null));
    });
    return () => { active = false; };
  }, []);
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
      goto("paymentResult", { replace: true });
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
    goto("paymentResult", { replace: true });
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
  }, [returned, dispatch, goto, setPaymentState, setSelectedTime]);

  // 決済結果の確認画面(WAITING/UNRESOLVED)から抜けてタイトルへ戻る。
  // 保留注文とURLの戻りパラメータを消すので、同じタブで再読込しても結果画面へ戻されない。
  // 抜ける前に1回だけ照会し、支払済みなら注文履歴へ残す。
  // 照会中(再確認ボタンの処理中)でも押せるよう、照会とは別のフラグで二重実行だけ防ぐ。
  const leaving = useRef(false);
  const leavePaymentResult = useCallback(async () => {
    if (leaving.current) return;
    leaving.current = true;
    try {
      const pending = readPendingPayment() ?? returned?.pending;
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
      goto("title");
    } finally {
      leaving.current = false;
    }
  }, [dispatch, goto, returned, setPaymentState, setSelectedTime]);

  useEffect(() => { void refreshPaymentStatus(); }, [refreshPaymentStatus]);
  return { refreshPaymentStatus, leavePaymentResult, checking };
}
