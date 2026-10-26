// タイトル画面で使用する見出し表示コンポーネント。
import type { CSSProperties } from "react";
import logoImg from "../image/logo.jpg";
import { orderSnapshotKey } from "../features/order/orderSnapshot";
import { formatDisplayReserved } from "../utils/dateFormat";
import { parseReservedToDate } from "../utils/orderUtils";
import type { OrderSnapshot, PendingPaymentNotice } from "../types";

interface TitleProps {
  onStart: () => void;
  onOpenLegalNotice: () => void;
  /** 注文履歴(新しい順)。 */
  savedOrders?: OrderSnapshot[];
  onViewSavedOrder?: (key: string) => void;
  /** 支払いを確認できていない注文。 */
  pendingPayments?: PendingPaymentNotice[];
  onOpenPendingPayment?: (sid: string) => void;
}

// 履歴ボタンに出す受取日時。保存時の表示文字列を優先し、無ければ予約日時から作る。
const reservedLabel = (s: OrderSnapshot): string => {
  if (s.displayReserved) return s.displayReserved;
  const d = parseReservedToDate(s.reservedAtIso, new Date(s.createdAt));
  return d ? formatDisplayReserved(d) : "";
};

export const Title = ({
  onStart,
  onOpenLegalNotice,
  savedOrders = [],
  onViewSavedOrder,
  pendingPayments = [],
  onOpenPendingPayment,
}: TitleProps) => {
  return (
    <div style={wrap}>
      <div style={card}>
        {/* タイトル部分 */}
        {logoImg && (
          <div style={logoBox}>
            <img src={logoImg} alt="CODEMATESロゴ" style={logoImgStyle} />
          </div>
        )}
        <h1 style={title}>
          CODEMATESの
          <br />
          やわらか角煮
        </h1>
        <p style={subtitle}>予約注文システム</p>

        {pendingPayments.length > 0 && (
          <section style={pendingBox} aria-label="支払いを確認できていないご注文">
            <h2 style={pendingTitle}>支払いを確認できていないご注文があります</h2>
            <p style={pendingText}>
              お支払い済みの場合は、支払い状況を確認すると番号札を表示できます。再度のお支払いはしないでください。
            </p>
            {pendingPayments.map((p) => (
              <button key={p.sid} style={savedOrderBtn} onClick={() => onOpenPendingPayment?.(p.sid)}>
                {p.orderId != null ? `注文番号 ${p.orderId} の` : "ご注文の"}支払い状況を確認
                {p.displayReserved && <span style={savedOrderSub}>{p.displayReserved} 受取</span>}
              </button>
            ))}
          </section>
        )}

        {/* メインボタン */}
        <button style={primaryBtn} onClick={onStart}>
          注文に進む
        </button>

        {savedOrders.length > 0 && (
          <section style={historyBox} aria-label="これまでのご注文">
            <h2 style={historyTitle}>これまでのご注文</h2>
            {savedOrders.map((s) => {
              const key = orderSnapshotKey(s);
              const reserved = reservedLabel(s);
              return (
                <button key={key} style={savedOrderBtn} onClick={() => onViewSavedOrder?.(key)}>
                  注文番号 {s.orderId}
                  {reserved && <span style={savedOrderSub}>{reserved} 受取</span>}
                </button>
              );
            })}
          </section>
        )}

        {/* 注意事項 */}
        <div style={noticeBox}>
          <h2 style={noticeTitle}>ご利用上の注意</h2>
          <ul style={noticeList}>
            <li>
              本システムでは <b>キャッシュレス決済のみ</b> ご利用いただけます。
              現金払いをご希望の方は、店舗にて直接ご注文ください。
            </li>
            <li>
              本システムをご利用の場合、<b>50円引きクーポンは適用外</b>{" "}
              となります。
              クーポンをご希望の方は、店舗でのご注文をお願いします。
            </li>
            <li><b>本システムでの決済には、外部の決済サービス『Paysys』を利用しています。</b></li>
            <li>
              ご利用にはブラウザの <b>保存機能（Cookie／ローカルストレージ）を有効化</b> する必要があります。
              また、<b>予約と番号札の確認および提示は同一ブラウザ</b> にて行ってください。
            </li>
            <li>
              本システムをご利用の間は、<b>ブラウザの閲覧データを消去しないでください。</b>
            </li>
            <li>
              予約時間または閉店時間を過ぎてもご来店いただけない場合や、
              その他お客様都合によるキャンセルについては、
              <b>返金いたしかねます</b>。 あらかじめご了承ください。
            </li>
            <li>
              在庫切れの場合はご注文をキャンセルさせていただく場合があります。
            </li>
            <li>システム障害時は店舗での対応に切り替える場合があります。</li>
          </ul>
        </div>

        <p style={{ marginTop: "16px" }}>
          <button style={legalLinkStyle} onClick={onOpenLegalNotice}>
            特定商取引法に基づく表示
          </button>
        </p>
      </div>
    </div>
  );
};

/* ===== styles ===== */
const wrap: CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#e5f2ff",
  padding: "24px",
  background:
    "radial-gradient(1200px 600px at 50% -10%, #fff 0%, #fef6ec 45%, #fff9f2 100%)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
};

const card: CSSProperties = {
  width: "min(720px, 94vw)",
  background: "#ffffff",
  border: "3px solid #222",
  borderRadius: "16px",
  padding: "28px 24px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  textAlign: "center",
};

const logoBox: CSSProperties = {
  width: "100px",
  height: "100px",
  margin: "0 auto 12px",
  borderRadius: "12px",
  background: "#fff",
  overflow: "hidden",
  display: "grid",
  placeItems: "center",
  border: "2px solid #ddd",
};

const logoImgStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
};

const title: CSSProperties = {
  fontSize: "28px",
  margin: "6px 0 2px 0",
  letterSpacing: "0.04em",
  lineHeight: "1.4",
};

const subtitle: CSSProperties = {
  fontSize: "18px",
  margin: "0 0 20px 0",
  color: "#555",
};

const primaryBtn: CSSProperties = {
  height: "64px",
  fontSize: "22px",
  fontWeight: "bold",
  borderRadius: "12px",
  border: "3px solid #222",
  background: "#ffe08a",
  width: "calc(100% - 60px)",
  cursor: "pointer",
};

const pendingBox: CSSProperties = {
  margin: "0 0 16px 0",
  padding: "12px",
  background: "#fff6e0",
  border: "2px solid #ff962d",
  borderRadius: "12px",
};

const pendingTitle: CSSProperties = {
  fontSize: "16px",
  margin: "0 0 4px 0",
  color: "#b45309",
};

const pendingText: CSSProperties = {
  fontSize: "14px",
  margin: "0 0 4px 0",
  color: "#555",
};

const historyBox: CSSProperties = {
  marginTop: "16px",
};

const historyTitle: CSSProperties = {
  fontSize: "16px",
  margin: "0 0 4px 0",
  color: "#555",
};

const savedOrderBtn: CSSProperties = {
  minHeight: "48px",
  fontSize: "16px",
  fontWeight: "bold",
  borderRadius: "10px",
  border: "2px solid #222",
  background: "#fff",
  width: "calc(100% - 60px)",
  marginTop: "8px",
  padding: "6px 8px",
  cursor: "pointer",
};

const savedOrderSub: CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: "normal",
  color: "#555",
};

const noticeBox: CSSProperties = {
  marginTop: "24px",
  textAlign: "left",
  background: "#e5f2ff",
  border: "2px dashed #aaa",
  borderRadius: "12px",
  padding: "12px 16px",
};

const noticeTitle: CSSProperties = { fontSize: "20px", marginBottom: "8px" };
const noticeList: CSSProperties = { fontSize: "15px", paddingLeft: "20px", lineHeight: "1.6" };

const legalLinkStyle: CSSProperties = {
  background: "none",
  border: "none",
  color: "#0066cc",
  textDecoration: "underline",
  fontSize: "14px",
  cursor: "pointer",
  padding: 0,
};
