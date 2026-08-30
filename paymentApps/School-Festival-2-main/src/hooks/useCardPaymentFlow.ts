// クレジットカード決済(PaySys経由)の送信・結果更新をまとめて扱うフック。
// 実体はuseMockPaymentFlow(カード・PayPay共通の実装)。ここではカード固有の値
// (モック注文ID・未実装時のエラー文言)だけを指定する薄いラッパー。
// PaySys(カード・PayPayとも)の実バックエンド連携は後任フロントエンド開発者が担当する。
// USE_MOCK_PAYMENTがオンの場合のみ、モックで決済成功画面まで到達できる迂回策であり、
// 実際のAPI接続(バックエンドへの注文作成・決済実行)は一切行っていない。
import type { Dispatch, SetStateAction } from "react";

import { useMockPaymentFlow } from "./useMockPaymentFlow";
import { MOCK_PAYSYS_CARD_ORDER_ID } from "../constants/mocks/paysysCardMock";
import type { AppAction, Cart, PaymentState } from "../types";

export function useCardPaymentFlow({
  cart,
  selectedTime,
  dispatch,
  setPaymentState,
}: {
  cart: Cart;
  selectedTime: string | null;
  dispatch: Dispatch<AppAction>;
  setPaymentState: Dispatch<SetStateAction<PaymentState>>;
}) {
  const { handlePay, submitting } = useMockPaymentFlow({
    cart,
    selectedTime,
    dispatch,
    setPaymentState,
    mockOrderId: MOCK_PAYSYS_CARD_ORDER_ID,
    notImplementedMessage:
      "クレジットカード決済(PaySys)は未実装です。後任担当者が実装予定です。",
  });

  return { handlePayWithCard: handlePay, submitting };
}
