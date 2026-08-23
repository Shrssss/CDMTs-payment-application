const LAST_ORDER_HOUR = 17;
const LAST_ORDER_MIN = 0;

export const Footer = ({
  sumPrice,
  next,
  prev,
  currentStep,
  testTime,
  numOfChosenMenu,
  difference,
}) => {
  const now = testTime || new Date();
  const isAfterLastOrder =
    now.getHours() > LAST_ORDER_HOUR ||
    (now.getHours() === LAST_ORDER_HOUR && now.getMinutes() >= LAST_ORDER_MIN);
  console.log("Footer now/testTime:", { now, testTime, isAfterLastOrder });
  console.log("Footer now/testTime:", {
    now: now.toString(),
    nowHours: now.getHours(),
    nowMinutes: now.getMinutes(),
    testTime: testTime ? testTime.toString() : testTime,
  });

  const isNextDisabled = () => {
    if (currentStep === "menu" && numOfChosenMenu === 0) {
      return true;
    } else if (currentStep === "drink" && difference !== 0) {
      return true;
    } else {
      return false;
    }
  };

  return (
    <div style={footerStyle}>
      {currentStep !== "title" && (
        <>
          <div style={{ flex: 1, textAlign: "left" }}>
            <button style={undoStyle} onClick={prev}>
              {" "}
              戻る
            </button>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <p style={priceStyle}>¥{sumPrice.toLocaleString()}</p>
          </div>
        </>
      )}
      {currentStep !== "time" && (
        <div style={{ flex: 1, textAlign: "right" }}>
          <button
            style={{
              ...nextStyle,
              ...(isNextDisabled() ? disabledBtnStyle : enabledBtnStyle),
            }}
            disabled={isNextDisabled()}
            aria-disabled={isNextDisabled()}
            onClick={(e) => {
              if (isNextDisabled()) return;
              e.stopPropagation();
              next();
            }}
          >
            次へ
          </button>
        </div>
      )}
      {currentStep === "time" && (
        //注文確定ボタン
        <div style={{ flex: 1, textAlign: "right" }}>
          <button
            style={{
              ...nextStyle,
              backgroundColor: "#ff962d",
              border: "2px solid #000",
              fontWeight: "bold",
              ...(isAfterLastOrder ? disabledBtnStyle : {}),
            }}
            disabled={isAfterLastOrder}
            aria-disabled={isAfterLastOrder}
            onClick={(e) => {
              if (isAfterLastOrder) return;
              e.stopPropagation();
              next();
            }}
          >
            注文確定
          </button>
        </div>
      )}
    </div>
  );
};

const footerStyle = {
  backgroundColor: "#a8d3ff",
  width: "100%",
  minHeight: "60px",
  padding: "0 10px",
  margin: "0px",
  display: "flex",
  alignItems: "center",
  //画面最下部に固定＆追従
  position: "fixed",
  bottom: "0",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  zIndex: 1000,
};

const undoStyle = {
  width: "70px",
  height: "40px",
  fontSize: "18px",
  lineHeight: "1",
  borderRadius: "4px",
  border: "1px solid #ccc",
};

const priceStyle = {
  margin: "0px 32px 0px 0px",
  fontSize: "28px",
  color: "red",
  fontWeight: "bold",
};

const nextStyle = {
  width: "100px",
  height: "40px",
  marginRight: "20px",
  fontSize: "18px",
  lineHeight: "1",
  borderRadius: "4px",
  border: "1px solid #ccc",
};

const enabledBtnStyle = {
  backgroundColor: "#fff",
  color: "#222",
  cursor: "pointer",
};

const disabledBtnStyle = {
  backgroundColor: "#eee",
  color: "#999",
  border: "1px solid #ddd",
  cursor: "not-allowed",
};
