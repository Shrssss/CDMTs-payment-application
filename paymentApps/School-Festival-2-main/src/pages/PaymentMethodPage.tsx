// 決済方法（クレジットカード / PayPay）を選択するモック画面。
import type { CSSProperties } from "react";
import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { USE_MOCK_PAYMENT } from "../constants/config";
import { canSavePendingPayment, STORAGE_UNAVAILABLE_MESSAGE } from "../features/payment/pendingPayment";

export const PaymentMethodPage = () => {
  const { goto, openLegalNotice: onOpenLegalNotice } = useAppContext();
  // 実際の決済では照合IDの保存が必須。保存できない環境では先に知らせ、決済へ進めないようにする。
  const [canPay] = useState(() => USE_MOCK_PAYMENT || canSavePendingPayment());
  const disabledStyle = canPay ? {} : disabledBtnStyle;
  return (
    <div style={{ padding: "12px 10px" }}>
      <p style={{ margin: "6px 10px" }}>お支払い方法を選択してください</p>

      {!canPay && (
        <p role="alert" style={storageAlertStyle}>
          {STORAGE_UNAVAILABLE_MESSAGE}
        </p>
      )}

      <button
        style={{ ...methodBtnStyle, ...disabledStyle }}
        onClick={() => goto("payment")}
        disabled={!canPay}
      >
        クレジットカードで支払う
      </button>

      <button
        style={{ ...methodBtnStyle, backgroundColor: "#ffe6a8", ...disabledStyle }}
        onClick={() => goto("paymentPaypay")}
        disabled={!canPay}
      >
        PayPayで支払う
      </button>

      <button style={backBtnStyle} onClick={() => goto("time")}>
        予約時間の選択に戻る
      </button>

      <p style={{ textAlign: "center", marginTop: "16px" }}>
        <button style={legalLinkStyle} onClick={onOpenLegalNotice}>
          特定商取引法に基づく表示
        </button>
      </p>
    </div>
  );
};

const methodBtnStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: "56px",
  fontSize: "18px",
  fontWeight: "bold",
  borderRadius: "8px",
  border: "2px solid #222",
  backgroundColor: "#fff",
  margin: "12px 0",
  cursor: "pointer",
};

const disabledBtnStyle: CSSProperties = {
  opacity: 0.5,
  cursor: "not-allowed",
};

const storageAlertStyle: CSSProperties = {
  margin: "12px 0",
  padding: "10px 12px",
  background: "#fff1f0",
  border: "2px solid #b00020",
  borderRadius: "8px",
  color: "#b00020",
  fontSize: "15px",
};

const legalLinkStyle: CSSProperties = {
  background: "none",
  border: "none",
  color: "#0066cc",
  textDecoration: "underline",
  fontSize: "14px",
  cursor: "pointer",
  padding: 0,
};

const backBtnStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: "44px",
  fontSize: "16px",
  borderRadius: "8px",
  border: "2px solid #888",
  backgroundColor: "#f4f4f4",
  margin: "12px 0",
  cursor: "pointer",
};
