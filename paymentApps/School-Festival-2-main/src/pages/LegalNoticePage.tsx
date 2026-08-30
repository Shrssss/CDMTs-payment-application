// 特定商取引法に基づく表示のモック画面。実際の記載内容は未確定のためプレースホルダーを表示する。
import type { CSSProperties } from "react";

const NOTICE_ITEMS = [
  { label: "販売事業者", value: "［要記入：団体名］" },
  { label: "運営責任者", value: "［要記入：責任者氏名］" },
  { label: "所在地", value: "［要記入：住所］" },
  { label: "連絡先", value: "［要記入：電話番号・メールアドレス］" },
  { label: "販売価格", value: "各商品ページに記載の価格（消費税込み）" },
  { label: "商品代金以外の必要料金", value: "なし" },
  { label: "お支払い方法", value: "クレジットカード決済、PayPay決済" },
  { label: "お支払い時期", value: "ご注文確定時" },
  { label: "商品の引渡時期", value: "ご予約いただいたお受け取り時刻" },
  { label: "返品・キャンセルについて", value: "お客様都合によるキャンセル・返金には応じられません" },
];

interface LegalNoticePageProps {
  onClose: () => void;
}

export const LegalNoticePage = ({ onClose }: LegalNoticePageProps) => {
  return (
    <div style={overlay}>
      <div style={card}>
        <h1 style={title}>特定商取引法に基づく表示</h1>
        <dl style={list}>
          {NOTICE_ITEMS.map(({ label, value }) => (
            <div key={label} style={row}>
              <dt style={term}>{label}</dt>
              <dd style={desc}>{value}</dd>
            </div>
          ))}
        </dl>
        <button style={closeBtn} onClick={onClose}>
          閉じる
        </button>
      </div>
    </div>
  );
};

/* ===== styles ===== */
const overlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "24px",
  zIndex: 2000,
  overflowY: "auto",
};

const card: CSSProperties = {
  width: "min(720px, 94vw)",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#ffffff",
  border: "3px solid #222",
  borderRadius: "16px",
  padding: "24px",
};

const title: CSSProperties = {
  fontSize: "22px",
  marginBottom: "16px",
};

const list: CSSProperties = {
  margin: 0,
};

const row: CSSProperties = {
  borderBottom: "1px solid #ddd",
  padding: "10px 0",
};

const term: CSSProperties = {
  fontWeight: "bold",
  fontSize: "14px",
  color: "#555",
};

const desc: CSSProperties = {
  margin: "4px 0 0 0",
  fontSize: "15px",
};

const closeBtn: CSSProperties = {
  marginTop: "20px",
  width: "100%",
  height: "44px",
  fontSize: "16px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  cursor: "pointer",
};
