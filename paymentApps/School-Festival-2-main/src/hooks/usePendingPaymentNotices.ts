// タイトル画面を開いたとき、保留中の照合ID(SID)をバックエンドに照会するフック。
// 支払済みなら注文履歴へ追加して保留から外し、未確認のものは「支払いを確認できていない注文」として返す。
// (戻りURLを経ずに戻ってきた・タブを閉じてしまった等で、払ったのに番号札が出ないことを防ぐ)
import { useEffect, useRef, useState } from "react";

import { readPaymentReturnParams, readPendingPayments, removePendingPayment } from "../features/payment/pendingPayment";
import { reservedDateOf, saveReturnOrderToHistory } from "../features/payment/paymentReturnOrder";
import type { Step } from "../constants/steps";
import { Api } from "../services/apiService";
import { formatDisplayReserved } from "../utils/dateFormat";
import type { PendingPaymentNotice } from "../types";

async function checkPendingPayment(sid: string): Promise<{ paid: boolean; notice: PendingPaymentNotice | null }> {
  let order;
  try {
    order = await Api.fetchPaymentReturnOrder(sid);
  } catch {
    // 照会できなかったものも案内に残し、結果画面から再確認できるようにする。
    return { paid: false, notice: { sid, orderId: null, displayReserved: null } };
  }
  if (order.state === "PAID") {
    try {
      saveReturnOrderToHistory(order);
      removePendingPayment(sid);
      return { paid: true, notice: null };
    } catch { /* 履歴に残せなければ案内に残す */ }
  }
  return {
    paid: false,
    notice: { sid, orderId: order.orderId, displayReserved: formatDisplayReserved(reservedDateOf(order)) },
  };
}

export function usePendingPaymentNotices({ step, onOrderHistoryChanged }: {
  step: Step | null;
  /** 支払済みの注文を注文履歴に追加したときに呼ぶ(タイトルの一覧を読み直すため)。 */
  onOrderHistoryChanged: () => void;
}): PendingPaymentNotice[] {
  const [notices, setNotices] = useState<PendingPaymentNotice[]>([]);
  // Paysysの戻りURLで開いた直後は決済結果画面で照会するので、最初のタイトル表示では照会しない。
  const landingFromReturn = useRef(readPaymentReturnParams(window.location.search) !== null);

  useEffect(() => {
    if (step !== "title") return;
    if (landingFromReturn.current) {
      landingFromReturn.current = false;
      return;
    }
    const pending = readPendingPayments();
    if (pending.length === 0) {
      setNotices([]);
      return;
    }
    let active = true;
    void Promise.all(pending.map(({ sid }) => checkPendingPayment(sid))).then((results) => {
      if (results.some((r) => r.paid)) onOrderHistoryChanged();
      if (active) setNotices(results.flatMap((r) => (r.notice ? [r.notice] : [])));
    });
    return () => { active = false; };
  }, [step, onOrderHistoryChanged]);

  return notices;
}
