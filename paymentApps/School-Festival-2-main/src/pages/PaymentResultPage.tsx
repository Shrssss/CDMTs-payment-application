// 決済結果と予約時刻の表示をまとめるページコンポーネント。
import type { Dispatch, SetStateAction } from "react";
import { formatReservedTimeHHmm, parseReservedToDate } from "../utils/orderUtils";
import type { AppAction, PaymentState } from "../types";

interface PaymentResultPageProps {
  paymentState: PaymentState;
  selectedTime: string | null;
  setPaymentState: Dispatch<SetStateAction<PaymentState>>;
  dispatch: Dispatch<AppAction>;
}

export const PaymentResultPage = ({ paymentState, selectedTime, setPaymentState, dispatch }: PaymentResultPageProps) => {
  const resetOutcome = () => {
    setPaymentState((prev) => ({
      ...prev,
      outcome: { ok: false, orderId: null, error: null, receiptUrl: null, displayReserved: null },
    }));
  };

  return (
    <>
      {paymentState.outcome.ok ? (
        <div style={{ padding: "12px" }}>
          <p
            style={{
              textAlign: "center",
              fontSize: 22,
              fontWeight: "bold",
              margin: "16px auto",
            }}
          >
            決済が完了しました
          </p>
          <p style={{ textAlign: "center", fontSize: 18, margin: "6px" }}>
            注文番号：<b>{paymentState.outcome.orderId}</b>
          </p>
          {paymentState.outcome.receiptUrl && (
            <p style={{ textAlign: "center", margin: "6px" }}>
              <a
                href={paymentState.outcome.receiptUrl}
                target="_blank"
                rel="noreferrer"
              >
                レシートを開く
              </a>
            </p>
          )}
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button
              style={{ width: 160, height: 44, fontSize: 18 }}
              onClick={() => dispatch({ type: "GOTO", step: "numberTag" })}
            >
              番号札を表示
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: "12px" }}>
          <p
            style={{
              textAlign: "center",
              fontSize: 22,
              fontWeight: "bold",
              margin: "16px auto",
              color: "red",
            }}
          >
            決済に失敗しました
          </p>
          {/* 現状のモック実装ではok:falseのときorderIdは常にnullなので、この分岐は
              まだ到達しない。PaySys実装後、「注文は作成できたが課金は失敗した」
              という状態(paymentSession.tsのcreatePaymentOrder()参照)になった際に
              意味を持つようになる想定で、あえて残してある。 */}
          {paymentState.outcome.orderId && (
            <p style={{ textAlign: "center", fontSize: 24, margin: "18px" }}>
              予約時刻：
              <b>
                {paymentState.outcome.displayReserved ??
                  formatReservedTimeHHmm(parseReservedToDate(selectedTime))}
              </b>
            </p>
          )}
          <p style={{ textAlign: "center", fontSize: 16, margin: "6px" }}>
            {paymentState.outcome.error || "不明なエラー"}
          </p>
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button
              style={{
                width: 160,
                height: 44,
                fontSize: 18,
                marginRight: 10,
              }}
              onClick={() => {
                resetOutcome();
                dispatch({ type: "GOTO", step: "cart" });
              }}
            >
              カートに戻る
            </button>
            <button
              style={{ width: 160, height: 44, fontSize: 18 }}
              onClick={() => {
                resetOutcome();
                dispatch({ type: "GOTO", step: "payment" });
              }}
            >
              再試行
            </button>
          </div>
        </div>
      )}
    </>
  );
};
