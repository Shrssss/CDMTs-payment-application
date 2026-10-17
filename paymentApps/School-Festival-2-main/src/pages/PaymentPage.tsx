// クレジットカード決済画面。useCardPaymentFlowフックが送信・結果更新を担う。
import type { CSSProperties } from "react";
import { useState } from "react";
import { useCardPaymentFlow } from "../hooks/useCardPaymentFlow";
import { useAppContext } from "../context/AppContext";

export const PaymentPage = () => {
  const { goto, setPaymentState, selectedTime, cart, openLegalNotice: onOpenLegalNotice } = useAppContext();
  const [email, setEmail] = useState("");
  const { handlePayWithCard, submitting, emailError } = useCardPaymentFlow({
    email,
    cart,
    selectedTime,
    goto,
    setPaymentState,
  });

  return (
    <div style={{ padding: "12px 10px" }}>
      <p style={{ margin: "6px 10px" }}>クレジットカードでのお支払い</p>

      <label htmlFor="payment-email">メールアドレス（必須）</label>
      <input
        id="payment-email"
        placeholder="example@example.com"
        style={{ boxSizing: "border-box", width: "100%", height: "40px", fontSize: "16px", padding: "0 8px", marginTop: "8px" }}
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={submitting}
        aria-invalid={Boolean(emailError)}
        aria-describedby={emailError ? "payment-email-error" : undefined}
      />
      {emailError && <p id="payment-email-error" role="alert" style={{ color: "#b00020" }}>{emailError}</p>}

      <button
        style={{ ...payBtnStyle, opacity: submitting ? 0.5 : 1 }}
        onClick={handlePayWithCard}
        disabled={submitting}
      >
        {submitting ? "処理中..." : "クレジットカード決済ページへ進む"}
      </button>

      <p style={{ color: "#808080" }}>この決済は外部決済サービス「Paysys」によって行われます</p>
      <p style={{ color: "#808080" }}>決済には数秒〜数十秒ほど時間がかかる場合があります。</p>
      <p style={{ color: "#808080" }}>また、EMV-3Dセキュア決済のためにメールアドレスの入力が必要です。ご了承ください。</p>

      {/* 処理中でも押せるようにする(カード入力画面を閉じて処理中のまま止まった場合の抜け道)。 */}
      <button style={backBtnStyle} onClick={() => goto("paymentMethod")}>
        お支払い方法の選択に戻る
      </button>

      <p style={{ textAlign: "center", marginTop: "16px" }}>
        <button style={legalLinkStyle} onClick={onOpenLegalNotice}>
          特定商取引法に基づく表示
        </button>
      </p>
    </div>
  );
};

const payBtnStyle: CSSProperties = {
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
