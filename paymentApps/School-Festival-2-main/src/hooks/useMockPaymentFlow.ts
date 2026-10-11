// カード・PayPay決済の送信・結果更新をまとめて扱う共通フック。
// useCardPaymentFlow.ts/usePayPayPaymentFlow.tsの実体で、決済手段ごとに違う値
// (モック注文ID・未実装時のエラー文言)だけをパラメータとして受け取る。
// 以前はカード用・PayPay用でほぼ同一の実装を別々のファイルに複製していたが、
// 決済完了フローの修正のたびに二重メンテが必要になっていたため統合した。
//
// PaySys(カード・PayPayとも)の実バックエンド連携は後任フロントエンド開発者が担当する。
// USE_MOCK_PAYMENTがオンの場合のみ、モックで決済成功画面まで到達できる迂回策であり、
// 実際のAPI接続(バックエンドへの注文作成・決済実行)は一切行っていない。
import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

import { ORDER_SNAPSHOT_CONFIG, USE_MOCK_PAYMENT } from "../constants/config";
import { buildOrderSnapshot } from "../features/order/orderSnapshot";
import { formatDisplayReserved } from "../utils/dateFormat";
import { setLocalStorageJSON } from "../utils/localStorage";
import { parseReservedToDate } from "../utils/orderUtils";
import type { AppAction, Cart, PaymentState } from "../types";

export interface UseMockPaymentFlowParams {
  cart: Cart;
  selectedTime: string | null;
  dispatch: Dispatch<AppAction>;
  setPaymentState: Dispatch<SetStateAction<PaymentState>>;
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
      // 実装は後任フロントエンド開発者が担当。ここでは未実装として扱う。
      setPaymentState((prev) => ({
        ...prev,
        outcome: {
          ok: false,
          orderId: null,
          error: notImplementedMessage,
          receiptUrl: null,
          displayReserved,
        },
      }));
    }

    setSubmitting(false);
    dispatch({ type: "GOTO", step: "paymentResult" });
  }, [cart, selectedTime, dispatch, setPaymentState, mockOrderId, notImplementedMessage]);

  return { handlePay, submitting };
}
