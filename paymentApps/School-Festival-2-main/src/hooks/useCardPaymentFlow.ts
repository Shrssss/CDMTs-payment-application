// Paysysの方式別準備・保留注文保存・外部POSTを接続する。モック有効時は共通モックを使う。
import type { Dispatch, SetStateAction } from "react";

import { useMockPaymentFlow } from "./useMockPaymentFlow";
import { MOCK_PAYSYS_CARD_ORDER_ID } from "../constants/mocks/paysysCardMock";
import type { AppAction, Cart, PaymentState } from "../types";
import { USE_MOCK_PAYMENT } from "../constants/config";
import { Api } from "../services/apiService";
import { parseReservedToDate } from "../utils/orderUtils";
import { buildOrderItems } from "../utils/orderUtils";
import { toLocalDateTimeString } from "../utils/dateFormat";
import { savePendingPayment } from "../features/payment/pendingPayment";
import { submitPaymentForm } from "../features/payment/submitPaymentForm";

import { useState } from "react";

export function useCardPaymentFlow({
  email,
  cart,
  selectedTime,
  dispatch,
  setPaymentState,
}: {
  email: string;
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
  const [emailError, setEmailError] = useState<string | null>(null);

  const handlePayWithCard = async () => {

    const validationError = validateCardEmail(email);

    setEmailError(validationError);
    
    if (validationError) return;

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

      try {
        const reservedDate = parseReservedToDate(selectedTime);

        if (!reservedDate) {
          throw new Error("予約時刻が不正です。");
        }

        const { items } = buildOrderItems(cart);

        if (items.length === 0) {
          throw new Error("注文内容が空です。");
        }

        const orderId = await Api.createOrder({
          items,
          orderDate: toLocalDateTimeString(new Date()),
          reservedTime: toLocalDateTimeString(reservedDate),
          servingStatus: 0,
          paymentStatus: false,
        });

        const prepared = await Api.prepareCardPayment({
          orderId,
          cardToken: response.id,
          mail: email,
        });

        savePendingPayment({
          orderId, sid: prepared.sid, method: "card", cart,
          reservedAtIso: reservedDate.toISOString(), createdAt: new Date().toISOString(),
        });
        submitPaymentForm(prepared);

      } catch {
        alert("決済準備に失敗しました。再度お試しください。");
      }finally {
        setSubmitting(false);
      }
    });

  } catch {
    alert("エラーが発生しました。再度お試しください。");
    setSubmitting(false);
  }
}

  return {
    handlePayWithCard,
    submitting: mockSubmitting || cardSubmitting,
    emailError,
  };
}

export function validateCardEmail(email: string): string | null {
  if (!email) 
    return "メールアドレスを入力してください。";

  if (!/^[A-Za-z0-9_.@-]+$/.test(email)) {
    return "半角英数字と記号 - _ . @ のみ使用できます。";
  }


  if (email.length > 100)
    return "メールアドレスは100文字以内で入力してください。";

  const parts = email.split("@");

  const local = parts[0];

  const domain = parts[1];
  
  if (parts.length !== 2
    || !local
    || local.startsWith(".")
    || local.endsWith(".")
    || local.includes("..")
    || !domain
    || !domain.split(".").every((label) => /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label)))
      {
        return "正しいメールアドレスを入力してください。";
    }
  return null;
}
