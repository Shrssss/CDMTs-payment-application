// 決済方法（クレジットカード / PayPay）を選択するモック画面。
import type { CSSProperties, Dispatch } from "react";
import type { AppAction } from "../types";

interface PaymentMethodPageProps {
  dispatch: Dispatch<AppAction>;
  onOpenLegalNotice: () => void;
}

export const PaymentMethodPage = ({ dispatch, onOpenLegalNotice }: PaymentMethodPageProps) => {
  return (
    <div style={{ padding: "12px 10px" }}>
      <p style={{ margin: "6px 10px" }}>お支払い方法を選択してください</p>

      <button
        style={methodBtnStyle}
        onClick={() => dispatch({ type: "GOTO", step: "payment" })}
      >
        クレジットカードで支払う
      </button>

      <button
        style={{ ...methodBtnStyle, backgroundColor: "#ffe6a8" }}
        onClick={() => dispatch({ type: "GOTO", step: "paymentPaypay" })}
      >
        PayPayで支払う
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

const legalLinkStyle: CSSProperties = {
  background: "none",
  border: "none",
  color: "#0066cc",
  textDecoration: "underline",
  fontSize: "14px",
  cursor: "pointer",
  padding: 0,
};
