import logoImg from "../image/logo.jpg";

export const Title = ({ onStart }) => {
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

        {/* メインボタン */}
        <button style={primaryBtn} onClick={onStart}>
          注文に進む
        </button>

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
            <li>
              ご利用にはブラウザの <b>Cookieを有効化</b> する必要があります。
              また、<b>予約と番号札の提示は同一ブラウザ</b> にて行ってください。
            </li>
            <li>
              予約時間または閉店時間を過ぎてもご来店いただけない場合や、
              その他お客様都合によるキャンセルについては、
              <b>返金いたしかねます</b>。 あらかじめご了承ください。
            </li>
            <li>
              在庫切れの場合はご注文をキャンセルさせていただく場合があります
            </li>
            <li>システム障害時は店舗での対応に切り替える場合があります</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

/* ===== styles ===== */
const wrap = {
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

const card = {
  width: "min(720px, 94vw)",
  background: "#ffffff",
  border: "3px solid #222",
  borderRadius: "16px",
  padding: "28px 24px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  textAlign: "center",
};

const logoBox = {
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

const logoImgStyle = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
};

const title = {
  fontSize: "28px",
  margin: "6px 0 2px 0",
  letterSpacing: "0.04em",
  lineHeight: "1.4",
};

const subtitle = {
  fontSize: "18px",
  margin: "0 0 20px 0",
  color: "#555",
};

const primaryBtn = {
  width: "100%",
  height: "64px",
  fontSize: "22px",
  fontWeight: "bold",
  borderRadius: "12px",
  border: "3px solid #222",
  background: "#ffe08a",
  width: "calc(100% - 60px)",
  cursor: "pointer",
};

const noticeBox = {
  marginTop: "24px",
  textAlign: "left",
  background: "#e5f2ff",
  border: "2px dashed #aaa",
  borderRadius: "12px",
  padding: "12px 16px",
};

const noticeTitle = { fontSize: "20px", marginBottom: "8px" };
const noticeList = { fontSize: "15px", paddingLeft: "20px", lineHeight: "1.6" };
