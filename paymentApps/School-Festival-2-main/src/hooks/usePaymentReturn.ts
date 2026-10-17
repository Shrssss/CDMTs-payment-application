// Paysysからの戻りと、決済結果画面(#/payment/result?sid=...)の表示内容をまとめるフック。
// 注文内容と支払い状況は、URLの照合ID(SID)でバックエンドから取り直す(GET /api/payments/return/{sid})。
// そのため結果画面は再読込しても同じ内容を出し直せる。
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useLocation } from "react-router";

import {
  clearPaymentReturnParams, isValidSid, readPaymentReturnParams, removePendingPayment, savePendingPayment,
} from "../features/payment/pendingPayment";
import { reservedDateOf, saveReturnOrderToHistory } from "../features/payment/paymentReturnOrder";
import { INITIAL_PAYMENT_STATE } from "../constants/initialState";
import type { Step } from "../constants/steps";
import { Api } from "../services/apiService";
import { formatDisplayReserved } from "../utils/dateFormat";
import type { AppAction, Goto, PaymentState } from "../types";

// 「トップに戻る」時の最終照会の待ち時間上限。通信が返らなくても抜けられることを優先する。
const LEAVE_STATUS_TIMEOUT_MS = 5000;

const INCOMPLETE_MESSAGE = "決済手続きが完了していない可能性があります。支払い状況を確認してください。";
const FETCH_FAILED_MESSAGE = "注文情報を取得できませんでした。再決済せず、時間をおいて状況を再確認してください。";
const NO_SID_MESSAGE = "注文を照合できませんでした。注文番号がわかる場合は係員にお伝えください。";

/** 決済結果画面へ渡すクエリ。incomplete はキャンセル・エラーで戻ってきたことを表す。 */
export const paymentResultSearch = (sid: string, incomplete = false): string =>
  `?sid=${sid}${incomplete ? "&incomplete=1" : ""}`;

export function usePaymentReturn({ step, dispatch, goto, setPaymentState, setSelectedTime }: {
  step: Step | null;
  dispatch: Dispatch<AppAction>;
  goto: Goto;
  setPaymentState: Dispatch<SetStateAction<PaymentState>>;
  setSelectedTime: Dispatch<SetStateAction<string | null>>;
}) {
  const params = new URLSearchParams(useLocation().search);
  const sidParam = params.get("sid");
  /** 決済結果画面で照会している注文の照合ID。結果画面以外やモック決済の結果では null。 */
  const resultSid = step === "paymentResult" && isValidSid(sidParam) ? sidParam : null;
  const incomplete = params.get("incomplete") === "1";

  // 照会中に別の画面へ移ったら、返ってきた結果で画面を書き換えないための目印。
  const currentSid = useRef(resultSid);
  useLayoutEffect(() => {
    currentSid.current = resultSid;
  });

  // 起動時: Paysysの戻りURL(/?paysys_return=...&return_sid=...)なら、戻りパラメータを消して決済結果画面へ移る。
  useEffect(() => {
    const returned = readPaymentReturnParams(window.location.search);
    if (!returned) return;
    clearPaymentReturnParams();
    if (returned.sid) {
      // 別のブラウザで戻ってきた場合も、後からタイトルで照会できるように残す。
      try { savePendingPayment(returned.sid); } catch { /* 残せなくても結果画面は出せる */ }
      goto("paymentResult", { replace: true, search: paymentResultSearch(returned.sid, returned.incomplete) });
      return;
    }
    setPaymentState(prev => ({ ...prev, outcome: {
      ok: false, status: "UNRESOLVED", orderId: null, error: NO_SID_MESSAGE,
      receiptUrl: null, displayReserved: null,
    } }));
    goto("paymentResult", { replace: true });
  }, [goto, setPaymentState]);

  const busy = useRef(false);
  const [checking, setChecking] = useState(false);
  const refreshPaymentStatus = useCallback(async () => {
    if (!resultSid || busy.current) return;
    const sid = resultSid;
    busy.current = true;
    setChecking(true);
    // 初回は「確認中」を出す。再確認のときは表示中の注文番号などを残したまま照会する。
    setPaymentState(prev => prev.outcome.status === "WAITING" ? prev : { ...prev, outcome: {
      ok: false, status: "WAITING", orderId: null, error: incomplete ? INCOMPLETE_MESSAGE : null,
      receiptUrl: null, displayReserved: null,
    } });
    try {
      const order = await Api.fetchPaymentReturnOrder(sid);
      if (currentSid.current !== sid) return;
      const reserved = reservedDateOf(order);
      const paid = order.state === "PAID";
      if (paid) {
        // 履歴に残せなかった場合は保留中のSIDを残し、後でタイトルから再照会できるようにする。
        try {
          saveReturnOrderToHistory(order);
          removePendingPayment(sid);
        } catch { /* 支払済みの表示は続ける */ }
      }
      // REPLACE_CART は既存カートと合成するため、先に空にして別の注文の商品が混ざらないようにする。
      dispatch({ type: "RESET_CART" });
      dispatch({ type: "REPLACE_CART", cart: order.cart });
      setSelectedTime(reserved.toISOString());
      setPaymentState(prev => ({ ...prev, outcome: {
        ok: paid, status: order.state, orderId: order.orderId,
        error: paid || !incomplete ? null : INCOMPLETE_MESSAGE,
        receiptUrl: null, displayReserved: formatDisplayReserved(reserved),
      } }));
    } catch {
      if (currentSid.current !== sid) return;
      setPaymentState(prev => ({ ...prev, outcome: {
        ...prev.outcome, ok: false, status: "WAITING", error: FETCH_FAILED_MESSAGE,
      } }));
    } finally {
      busy.current = false;
      setChecking(false);
    }
  }, [resultSid, incomplete, dispatch, setPaymentState, setSelectedTime]);

  // 結果画面を開いたとき(戻ってきた直後・再読込・タイトルの案内から)に照会する。
  useEffect(() => { void refreshPaymentStatus(); }, [refreshPaymentStatus]);

  // 決済結果の確認画面(WAITING/UNRESOLVED)から抜けてタイトルへ戻る。
  // 抜ける前に1回だけ照会し、支払済みなら注文履歴へ残す。保留中のSIDは消すので、
  // 支払いをやめた注文がタイトルに案内され続けることはない。
  // 照会中(再確認ボタンの処理中)でも押せるよう、照会とは別のフラグで二重実行だけ防ぐ。
  const leaving = useRef(false);
  const leavePaymentResult = useCallback(async () => {
    if (leaving.current) return;
    leaving.current = true;
    try {
      if (resultSid) {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          const order = await Promise.race([
            Api.fetchPaymentReturnOrder(resultSid),
            new Promise<never>((_, reject) => {
              timer = setTimeout(() => reject(new Error("timeout")), LEAVE_STATUS_TIMEOUT_MS);
            }),
          ]);
          if (order.state === "PAID") saveReturnOrderToHistory(order);
        } catch { /* 照会・保存できなくても抜けられることを優先する。 */ } finally {
          clearTimeout(timer);
        }
        removePendingPayment(resultSid);
      }
      setPaymentState(prev => ({ ...prev, outcome: INITIAL_PAYMENT_STATE.outcome }));
      setSelectedTime(null);
      dispatch({ type: "RESET_CART" });
      goto("title");
    } finally {
      leaving.current = false;
    }
  }, [resultSid, dispatch, goto, setPaymentState, setSelectedTime]);

  return { resultSid, refreshPaymentStatus, leavePaymentResult, checking };
}
