// 予約可能な時刻の候補を表示し、選択結果を親へ通知するコンポーネント。
import { useMemo, useEffect, useRef, type CSSProperties } from "react";
import { RESERVATION_CONFIG } from "../constants/config";
import { generateTimeOptions } from "../features/reservation/reservationSchedule";

interface TimeSelectProps {
  onTimeChange?: (value: string) => void;
  testTime?: Date | null;
}

// 本体
export const TimeSelect = ({ onTimeChange, testTime }: TimeSelectProps) => {
  const now = useMemo(() => {
    return testTime || new Date();
  }, [testTime]);
  const timeOptions = useMemo(() => generateTimeOptions(now, RESERVATION_CONFIG), [now]);
  const initialTimeRef = useRef(timeOptions[0]?.value || null);

  //現在時刻をフォーマット
  const currentHour = String(now.getHours()).padStart(2, "0");
  const currentMinutes = String(now.getMinutes()).padStart(2, "0");
  const formattedTime = `${currentHour}:${currentMinutes}`;

  // 初回マウント時だけ親へ初期値を通知する。
  // 再レンダリングのたびに呼ぶと、ユーザー選択を先頭値で上書きしてしまう。
  useEffect(() => {
    if (initialTimeRef.current && typeof onTimeChange === "function") {
      try {
        onTimeChange(initialTimeRef.current);
      } catch (e) {
        // 親が同期的にエラーを投げても無視してループを防ぐ
        console.warn("TimeSelect: onTimeChange threw:", e);
      }
    }
  }, [onTimeChange]);

  if (timeOptions.length === 0) {
    return (
      <p style={{ ...containerStyle, color: "red" }}>
        本日の予約受付は終了しました。
      </p>
    );
  }

  return (
    <div style={containerStyle}>
      <p style={titleStyle}>予約時刻確認</p>
      <p style={currentTimeStyle}>現在時刻: {formattedTime}</p>
      <label htmlFor="reservation-time" style={labelStyle}>
        予約時刻を選択してください:
      </label>
      <select
        id="reservation-time"
        defaultValue={timeOptions[0].value}
        onChange={(e) => {
          // 変更があったら、Propsとして渡された親の関数を呼び出す
          if (onTimeChange) {
            try {
              onTimeChange(e.target.value);
            } catch (e) {
              console.warn("TimeSelect: onTimeChange threw:", e);
            }
          }
        }}
        style={selectStyle}
      >
        {timeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const containerStyle: CSSProperties = {
  padding: "20px",
  textAlign: "center",
};

const titleStyle: CSSProperties = {
  fontSize: "22px",
  fontWeight: "bold",
  margin: "10px auto",
};

const currentTimeStyle: CSSProperties = {
  fontSize: "16px",
  margin: "10px auto",
  color: "#666",
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "16px",
  margin: "16px auto 8px",
  fontWeight: "bold",
};

const selectStyle: CSSProperties = {
  fontSize: "16px",
  padding: "8px 12px",
  margin: "8px auto",
  borderRadius: "4px",
  border: "1px solid #ccc",
  width: "200px",
};
