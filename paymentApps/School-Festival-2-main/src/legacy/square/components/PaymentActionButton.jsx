// ⚠️ 未使用(Square廃止に伴い隔離。importしないこと)
// カード決済の送信ボタン。カード未接続時は無効化し、送信中はスピナーを表示する。
import { useState } from "react";

export const PaymentActionButton = ({ paymentState, handleSubmitOrderFlow }) => {
  const [submitting, setSubmitting] = useState(false);
  const disabled = !paymentState.cardAttached || submitting;

  const onClick = async () => {
    if (disabled) return;
    setSubmitting(true);
    try {
      await handleSubmitOrderFlow();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button
      style={{ ...payBtnStyle, opacity: disabled ? 0.5 : 1 }}
      onClick={onClick}
      disabled={disabled}
    >
      {submitting ? (
        <span
          style={{
            display: "inline-block",
            width: "18px",
            height: "18px",
            border: "3px solid #fff",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "cm-spin 0.8s linear infinite",
          }}
        />
      ) : (
        "支払う"
      )}
    </button>
  );
};

const payBtnStyle = {
  display: "block",
  width: "100%",
  height: "56px",
  fontSize: "18px",
  fontWeight: "bold",
  borderRadius: "8px",
  border: "2px solid #222",
  backgroundColor: "#222",
  color: "#fff",
  margin: "12px 0",
  cursor: "pointer",
};
