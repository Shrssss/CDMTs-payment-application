// Order.jsx
export const Order = ({ cart = {}, price = {}, names = {} }) => {
  // 表示順：10 → 20 → 40 → 41 → 42 → 43 → 44 → 50 → 51 → 52 → 53 → 54 → 30 → 31 → 32 → 33 → 34
  const displayOrder = [
    10, 20, 40, 41, 42, 43, 44, 50, 51, 52, 53, 54, 30, 31, 32, 33, 34,
  ];

  let totalItems = 0; // ※セット内訳(41-44,51-54,31-34)は合計から除外
  let totalPrice = 0;

  const rows = [];

  const isSetDrink = (id) => (id >= 41 && id <= 44) || (id >= 51 && id <= 54);
  const isSubOf30 = (id) => id >= 31 && id <= 34; // ← 30の内訳も“セット風”表示にする

  const getLabel = (id) => {
    // 31-34 / 41-44 / 51-54 は 91-94 の名前を流用
    if (isSubOf30(id) || isSetDrink(id)) {
      const drinkIndex = id % 10; // 1..4
      const drinkId = 90 + drinkIndex; // 91..94
      return names[drinkId] ?? `ドリンク ${drinkIndex}`;
    }
    return names[id] ?? `商品 ${id}`;
  };

  for (const id of displayOrder) {
    const qty = cart[id] || 0;
    if (qty <= 0) continue;

    const label = getLabel(id);

    // セット内訳(41-44,51-54) と 30の内訳(31-34) は
    // 価格を出さず「◯個 セット/内訳」表示、合計にも加算しない
    if (isSetDrink(id) || isSubOf30(id)) {
      rows.push(
        <div key={id} style={setRowStyle}>
          <p style={{ fontSize: "18px", margin: "6px" }}>{label}</p>
          <p style={rightLineStyle}>{qty}個</p>
        </div>
      );
      continue;
    }

    // 通常行（10,20,40,50,30）は金額あり＆合計加算
    const unit = price[id] || 0;
    const sub = unit * qty;
    totalItems += qty;
    totalPrice += sub;

    rows.push(
      <div key={id} style={normalRowStyle}>
        <p style={{ fontSize: "18px", margin: "6px" }}>{label}</p>
        <p style={rightLineStyle}>
          {qty}個　¥{sub.toLocaleString()}
        </p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div style={normalRowStyle}>
        <p style={{ fontSize: "20px", margin: "6px" }}>カートは空です</p>
      </div>
    );
  }

  return (
    <>
      {rows}
      <div
        style={{ ...normalRowStyle, border: "2px solid", marginTop: "30px" }}
      >
        <p style={{ fontSize: "20px", margin: "6px", fontWeight: "bold" }}>
          合計
        </p>
        <p style={{ ...rightLineStyle, color: "red", fontSize: "20px" }}>
          {totalItems}個　¥{totalPrice.toLocaleString()}
        </p>
      </div>
    </>
  );
};

const normalRowStyle = {
  border: "3px solid #222",
  width: "auto",
  minHeight: "64px",
  padding: "8px",
  margin: "6px",
  borderRadius: "8px",
  backgroundColor: "#fff",
};

const setRowStyle = {
  ...normalRowStyle,
  border: "3px solid #aaa",
  marginLeft: "40px",
};

const rightLineStyle = {
  textAlign: "right",
  margin: "6px 10px 6px 6px",
  fontSize: "20px",
  fontWeight: "bold",
};
