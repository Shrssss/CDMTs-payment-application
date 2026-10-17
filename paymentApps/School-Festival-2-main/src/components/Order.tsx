// 注文内容の一覧と数量表示をまとめて描画するコンポーネント。
// セットとドリンクの紐付け(割り振り)はバックエンドが行う方針のため、フロントでは
// 「商品(価格あり)」と「選んだドリンク(価格なし、種別ごとの合計数のみ)」を
// 紐付けない2つの独立したリストとして表示する
// (docs/backend-requirements.md 5番、cartOrganizer.tsのコメント参照)。
import type { CSSProperties } from "react";
// import { PRODUCT_CATEGORY_IDS, DRINK_TYPE_IDS } from "../constants/items";
import type { Cart, NameMap, PriceMap } from "../types";
// import { useCardPaymentFlow } from "../hooks/useCardPaymentFlow";

interface OrderProps {
  cart: Cart;
  price?: PriceMap;
  names?: NameMap;
}

const itemsConstant=[
  {
    "itemId": 10,
    "itemName": "角煮 単品",
    "price": 470,
    "imagePath": null,
    "available": true
  },
  {
    "itemId": 20,
    "itemName": "角煮大盛り 単品",
    "price": 670,
    "imagePath": null,
    "available": true
  },
  {
    "itemId": 30,
    "itemName": "ドリンク 単品",
    "price": 150,
    "imagePath": null,
    "available": true
  },
  {
    "itemId": 40,
    "itemName": "【お得】角煮ドリンクセット",
    "price": 570,
    "imagePath": null,
    "available": true
  },
  {
    "itemId": 50,
    "itemName": "【お得】角煮ドリンクセット大盛り",
    "price": 770,
    "imagePath": null,
    "available": true
  },
  {
    "itemId": 91,
    "itemName": "コーラ",
    "price": 0,
    "imagePath": null,
    "available": true
  },
  {
    "itemId": 92,
    "itemName": "なっちゃんオレンジ",
    "price": 0,
    "imagePath": null,
    "available": true
  },
  {
    "itemId": 93,
    "itemName": "三ツ矢サイダー",
    "price": 0,
    "imagePath": null,
    "available": true
  },
  {
    "itemId": 94,
    "itemName": "烏龍茶",
    "price": 0,
    "imagePath": null,
    "available": true
  }
]

export const Order = ({ cart }: OrderProps) => {
  const items=Object.entries(cart).map(([key,value])=>{
    return {id:parseInt(key),quantity:value}
  }).filter(item=>item.quantity!==0)
  

  const targetItems=items.map(item=>{
    const found=itemsConstant.find(c=>c.itemId===item.id)
    return found ? {...found,quantity:item.quantity} : undefined
  }).filter(item=>!!item)

  // 価格ありの商品と、価格0のドリンク(種別ごとの数のみ)を分けて表示する
  const products=targetItems.filter(item=>item.price>0)
  const drinks=targetItems.filter(item=>item.price===0)

  let totalPrice=0
  for(let i=0;i<products.length;i++){
    totalPrice+=products[i].price*products[i].quantity
  }

  if(targetItems.length===0){
    return <div style={cardStyle}>
      <p style={emptyStyle}>商品が選択されていません</p>
    </div>
  }

  return <div style={cardStyle}>
    <h2 style={headingStyle}>ご注文内容</h2>
    <ul style={listStyle}>
      {products.map(item=>(
        <li key={item.itemId} style={rowStyle}>
          <span style={nameStyle}>{item.itemName}</span>
          <span style={qtyStyle}>×{item.quantity}</span>
          <span style={priceStyle}>&yen;{(item.price*item.quantity).toLocaleString()}</span>
        </li>
      ))}
    </ul>
    {drinks.length>0 && <div style={drinkSectionStyle}>
      <p style={subHeadingStyle}>お選びのドリンク</p>
      <div style={chipWrapStyle}>
        {drinks.map(item=>(
          <span key={item.itemId} style={chipStyle}>
            {item.itemName}<span style={chipQtyStyle}>×{item.quantity}</span>
          </span>
        ))}
      </div>
    </div>}
    <div style={totalRowStyle}>
      <span>合計</span>
      <span style={totalPriceStyle}>&yen;{totalPrice.toLocaleString()}</span>
    </div>
  </div>
}

const cardStyle: CSSProperties = {
  maxWidth: "480px",
  margin: "16px auto",
  padding: "20px 24px",
  background: "#fff",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  textAlign: "left",
  boxSizing: "border-box",
};

const headingStyle: CSSProperties = {
  margin: "0 0 12px",
  fontSize: "20px",
  textAlign: "center",
  color: "#222",
};

const listStyle: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
};

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "12px",
  padding: "10px 0",
  borderBottom: "1px dashed #ddd",
  fontSize: "17px",
};

const nameStyle: CSSProperties = {
  flex: 1,
  color: "#222",
};

const qtyStyle: CSSProperties = {
  color: "#666",
  minWidth: "2.5em",
  textAlign: "right",
};

const priceStyle: CSSProperties = {
  minWidth: "5em",
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
  color: "#222",
};

const drinkSectionStyle: CSSProperties = {
  marginTop: "14px",
};

const subHeadingStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: "14px",
  color: "#666",
};

const chipWrapStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

const chipStyle: CSSProperties = {
  padding: "4px 12px",
  borderRadius: "999px",
  background: "#e5f2ff",
  border: "1px solid #b8d9fb",
  fontSize: "15px",
  color: "#1f4f82",
};

const chipQtyStyle: CSSProperties = {
  marginLeft: "6px",
  fontWeight: "bold",
};

const totalRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  marginTop: "16px",
  paddingTop: "12px",
  borderTop: "2px solid #222",
  fontSize: "18px",
  fontWeight: "bold",
};

const totalPriceStyle: CSSProperties = {
  fontSize: "26px",
  fontVariantNumeric: "tabular-nums",
};

const emptyStyle: CSSProperties = {
  margin: 0,
  textAlign: "center",
  color: "#888",
};

