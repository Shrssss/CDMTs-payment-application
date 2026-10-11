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
import { USE_MOCK_PAYMENT } from "../constants/config";

import { useState } from "react";

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

  const { handlePay, submitting: mockSubmitting } = useMockPaymentFlow({
    cart,
    selectedTime,
    dispatch,
    setPaymentState,
    mockOrderId: MOCK_PAYSYS_CARD_ORDER_ID,
    notImplementedMessage:
      "クレジットカード決済(PaySys)は未実装です。後任担当者が実装予定です。",
  });

  const [cardSubmitting, setSubmitting] = useState(false);

  const handlePayWithCard = async () => {
    if (USE_MOCK_PAYMENT) {
      await handlePay();
      return;
    }

    const sdk = window.metapspayment;

    if (!sdk) {
      alert(
        "カード決済を読み込めませんでした。再読み込みしてください。"
      );
      return;
    }

    if (cardSubmitting) {
      alert("カード情報の確認中です。しばらくお待ちください。");
      return;
    }

    setSubmitting(true);
    try{
      sdk.setRequireName(true);
      sdk.setRequireCsc(true);

      const tokenRejex = /^[A-Za-z0-9]{16}$/;

      sdk.createTokenWin(async (status, response) => {

      if (status !== 201
          || response.error
          || typeof response.id !== "string"
          || !tokenRejex.test(response.id)
      ){
        alert("カード情報の確認に失敗しました。再度お試しください。");
        setSubmitting(false);
        return;
      }

      alert("カード情報の確認に成功しました");

      try {
        await prepareCardPayment(response.id);
      } catch (error) {
        alert("決済準備に失敗しました。再度お試しください。");
      }finally {
        setSubmitting(false);
      }
    });

  } catch (error) {
    alert("エラーが発生しました。再度お試しください。");
    setSubmitting(false);
  }
}

  return {
    handlePayWithCard,
    submitting: mockSubmitting || cardSubmitting,
  };
}
