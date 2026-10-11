// 画面下部のナビゲーションと合計表示を担当するフッターコンポーネント。
import type { CSSProperties } from "react";
import { getFooterActionLabel, isFooterNextDisabled, shouldShowFooter } from "../constants/stepRules";
import type { Step } from "../constants/steps";

interface FooterProps {
  sumPrice: number;
  next: () => void;
  prev: () => void;
  currentStep: Step;
  testTime?: Date | null;
  numOfChosenMenu?: number;
  difference?: number;
}

export const Footer = ({
  sumPrice,
  next,
  prev,
  currentStep,
  testTime,
  numOfChosenMenu,
  difference,
}: FooterProps) => {
  const now = testTime || new Date();
  const showFooter = shouldShowFooter(currentStep);
  const nextDisabled = isFooterNextDisabled(currentStep, {
    numOfChosenMenu,
    difference,
    now,
  });
  const actionLabel = getFooterActionLabel(currentStep);

  if (!showFooter) {
    return null;
  }

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
              ...(nextDisabled ? disabledBtnStyle : enabledBtnStyle),
            }}
            disabled={nextDisabled}
            aria-disabled={nextDisabled}
            onClick={(e) => {
              if (nextDisabled) return;
              e.stopPropagation();
              next();
            }}
          >
            {actionLabel}
          </button>
        </div>
      )}
      {currentStep === "time" && (
        //注文確定ボタン(有効/無効の判定はstepRules.tsのisFooterNextDisabledに一本化)
        <div style={{ flex: 1, textAlign: "right" }}>
          <button
            style={{
              ...nextStyle,
              backgroundColor: "#ff962d",
              border: "2px solid #000",
              fontWeight: "bold",
              ...(nextDisabled ? disabledBtnStyle : {}),
            }}
            disabled={nextDisabled}
            aria-disabled={nextDisabled}
            onClick={(e) => {
              if (nextDisabled) return;
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

const footerStyle: CSSProperties = {
  backgroundColor: "#a8d3ff",
  width: "100%",
  minHeight: "60px",
  padding: "0 10px",
  margin: "0px",
  //画面最下部に固定＆追従
  position: "fixed",
  bottom: "0",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  zIndex: 1000,
};

const undoStyle: CSSProperties = {
  width: "70px",
  height: "40px",
  fontSize: "18px",
  lineHeight: "1",
  borderRadius: "4px",
  border: "1px solid #ccc",
};

const priceStyle: CSSProperties = {
  margin: "0px 32px 0px 0px",
  fontSize: "28px",
  color: "red",
  fontWeight: "bold",
};

const nextStyle: CSSProperties = {
  width: "100px",
  height: "40px",
  marginRight: "20px",
  fontSize: "18px",
  lineHeight: "1",
  borderRadius: "4px",
  border: "1px solid #ccc",
};

const enabledBtnStyle: CSSProperties = {
  backgroundColor: "#fff",
  color: "#222",
  cursor: "pointer",
};

const disabledBtnStyle: CSSProperties = {
  backgroundColor: "#eee",
  color: "#999",
  border: "1px solid #ddd",
  cursor: "not-allowed",
};
