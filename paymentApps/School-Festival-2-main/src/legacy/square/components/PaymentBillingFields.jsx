// ⚠️ 未使用(Square廃止に伴い隔離。importしないこと)
// カード決済の請求先情報(苗字・名前・メールアドレス)入力フォーム。
export const PaymentBillingFields = ({ paymentState, setPaymentState }) => {
  const billingInfo = paymentState.billingInfo || {
    familyName: "",
    givenName: "",
    email: "",
  };

  const updateField = (field) => (e) => {
    const value = e.target.value;
    setPaymentState((prev) => ({
      ...prev,
      billingInfo: { ...(prev.billingInfo || billingInfo), [field]: value },
    }));
  };

  return (
    <div style={{ margin: "12px 10px" }}>
      <label style={labelStyle}>
        苗字
        <input
          type="text"
          value={billingInfo.familyName}
          onChange={updateField("familyName")}
          style={inputStyle}
        />
      </label>
      <label style={labelStyle}>
        名前
        <input
          type="text"
          value={billingInfo.givenName}
          onChange={updateField("givenName")}
          style={inputStyle}
        />
      </label>
      <label style={labelStyle}>
        メールアドレス
        <input
          type="email"
          value={billingInfo.email}
          onChange={updateField("email")}
          style={inputStyle}
        />
      </label>
    </div>
  );
};

const labelStyle = {
  display: "block",
  fontSize: "14px",
  margin: "8px 0",
};

const inputStyle = {
  display: "block",
  width: "100%",
  height: "40px",
  fontSize: "16px",
  padding: "4px 8px",
  boxSizing: "border-box",
  border: "1px solid #999",
  borderRadius: "4px",
  marginTop: "4px",
};
