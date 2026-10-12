// Paysysの方式別準備・保留注文保存・外部POSTを接続する。モック有効時は共通モックを使う。
import type { Dispatch, SetStateAction } from "react";

import { useMockPaymentFlow } from "./useMockPaymentFlow";
import { MOCK_PAYPAY_ORDER_ID } from "../constants/mocks/paypayPaymentMock";
import type { AppAction, Cart, PaymentState } from "../types";
import { USE_MOCK_PAYMENT } from "../constants/config";
import { Api } from "../services/apiService";
import { parseReservedToDate } from "../utils/orderUtils";
import { buildOrderItems } from "../utils/orderUtils";
import { toLocalDateTimeString } from "../utils/dateFormat";
import { savePendingPayment } from "../features/payment/pendingPayment";
import { submitPaymentForm } from "../features/payment/submitPaymentForm";

import { useState } from "react";

export function usePayPayPaymentFlow({
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
    mockOrderId: MOCK_PAYPAY_ORDER_ID,
    notImplementedMessage:
      "PayPay決済(PaySys)は未実装です。後任担当者が実装予定です。",
  });

  const [paypaySubmitting, setSubmitting] = useState(false);

  const handlePayWithPayPay = async () => {

    if (USE_MOCK_PAYMENT) {
      await handlePay();
      return;
    }

    if (paypaySubmitting) {
      alert("PayPay情報の確認中です。しばらくお待ちください。");
      return;
    }

    setSubmitting(true);
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

        const prepared = await Api.preparePayPayPayment({
          orderId,
        });

        savePendingPayment({
          orderId, sid: prepared.sid, method: "paypay", cart,
          reservedAtIso: reservedDate.toISOString(), createdAt: new Date().toISOString(),
        });
        submitPaymentForm(prepared);

      } catch {
        alert("エラーが発生しました。再度お試しください。");
      }finally{
          setSubmitting(false);
        }
      }

  return {
    handlePayWithPayPay,
    submitting: mockSubmitting || paypaySubmitting,
  };
}