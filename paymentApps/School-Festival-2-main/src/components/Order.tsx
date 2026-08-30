// 注文内容の一覧と数量表示をまとめて描画するコンポーネント。
// セットとドリンクの紐付け(割り振り)はバックエンドが行う方針のため、フロントでは
// 「商品(価格あり)」と「選んだドリンク(価格なし、種別ごとの合計数のみ)」を
// 紐付けない2つの独立したリストとして表示する
// (docs/backend-requirements.md 5番、cartOrganizer.tsのコメント参照)。
import type { CSSProperties } from "react";
import { PRODUCT_CATEGORY_IDS, DRINK_TYPE_IDS } from "../constants/items";
import type { Cart, NameMap, PriceMap } from "../types";

interface OrderProps {
  cart?: Cart;
  price?: PriceMap;
  names?: NameMap;
}

export const Order = ({ cart = {}, price = {}, names = {} }: OrderProps) => {
  let totalItems = 0;
  let totalPrice = 0;

  const itemRows = [];
  for (const id of PRODUCT_CATEGORY_IDS) {
    const qty = cart[id] || 0;
    if (qty <= 0) continue;

    const unit = price[id] || 0;
    const sub = unit * qty;
    totalItems += qty;
    totalPrice += sub;

    itemRows.push(
      <div key={id} style={normalRowStyle}>
        <p style={{ fontSize: "18px", margin: "6px" }}>{names[id] ?? `商品 ${id}`}</p>
        <p style={rightLineStyle}>
          {qty}個　¥{sub.toLocaleString()}
        </p>
      </div>
    );
  }

  const drinkRows = [];
  for (const id of DRINK_TYPE_IDS) {
    const qty = cart[id] || 0;
    if (qty <= 0) continue;

    drinkRows.push(
      <div key={id} style={drinkRowStyle}>
        <p style={{ fontSize: "18px", margin: "6px" }}>{names[id] ?? `ドリンク ${id}`}</p>
        <p style={rightLineStyle}>{qty}個</p>
      </div>
    );
  }

  if (itemRows.length === 0 && drinkRows.length === 0) {
    return (
      <div style={normalRowStyle}>
        <p style={{ fontSize: "20px", margin: "6px" }}>カートは空です</p>
      </div>
    );
  }

  return (
    <>
      {itemRows}

      {drinkRows.length > 0 && (
        <>
          <p style={drinkSectionTitleStyle}>選んだドリンク</p>
          {drinkRows}
        </>
      )}

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

const normalRowStyle: CSSProperties = {
  border: "3px solid #222",
  width: "auto",
  minHeight: "64px",
  padding: "8px",
  margin: "6px",
  borderRadius: "8px",
  backgroundColor: "#fff",
};

const drinkRowStyle: CSSProperties = {
  ...normalRowStyle,
  border: "3px solid #aaa",
};

const drinkSectionTitleStyle: CSSProperties = {
  fontSize: "16px",
  fontWeight: "bold",
  margin: "16px 6px 4px",
  color: "#555",
};

const rightLineStyle: CSSProperties = {
  margin: "6px",
  textAlign: "right",
  fontSize: "18px",
};
