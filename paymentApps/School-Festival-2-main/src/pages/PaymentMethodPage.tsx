// 決済方法（クレジットカード / PayPay）を選択するモック画面。
import type { CSSProperties } from "react";
import { useAppContext } from "../context/AppContext";

export const PaymentMethodPage = () => {
  const { goto, openLegalNotice: onOpenLegalNotice } = useAppContext();
  return (
    <div style={{ padding: "12px 10px" }}>
      <p style={{ margin: "6px 10px" }}>お支払い方法を選択してください</p>

      <button
        style={methodBtnStyle}
        onClick={() => goto("payment")}
      >
        クレジットカードで支払う
      </button>

      <button
        style={{ ...methodBtnStyle, backgroundColor: "#ffe6a8" }}
        onClick={() => goto("paymentPaypay")}
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
