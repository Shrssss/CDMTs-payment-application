import React, { useState, useMemo, useEffect } from "react";

// テスト時のみ true にしてください。本番環境では必ず false に戻してください。
const IS_DEBUG_MODE = false;
const DEBUG_TIME = new Date(2025, 8, 22, 12, 0, 0);

// 定数
const START_OFFSET_MINUTES = 10;
const LAST_ORDER_HOUR = 17;
const INTERVAL_MINUTES = 5;

//予約可能な時刻オプションの配列を生成する関数
const generateTimeOptions = (now) => {
  const startTargetTime = new Date(
    now.getTime() + START_OFFSET_MINUTES * 60000
  );

  const minutes = startTargetTime.getMinutes();
  const minutesToRound = minutes % INTERVAL_MINUTES;

  let roundedMinutes = minutes;
  if (minutesToRound !== 0) {
    roundedMinutes = minutes + (INTERVAL_MINUTES - minutesToRound);
  }

  const startTime = new Date(startTargetTime);
  startTime.setMinutes(roundedMinutes);
  startTime.setSeconds(0, 0);
  startTime.setMilliseconds(0);

  const options = [];
  let currentTime = startTime;

  while (true) {
    const currentHour = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();

    if (
      currentHour > LAST_ORDER_HOUR ||
      (currentHour === LAST_ORDER_HOUR && currentMinutes > 0)
    ) {
      break;
    }

    const timeString = `${String(currentHour).padStart(2, "0")}:${String(
      currentMinutes
    ).padStart(2, "0")}`;
    options.push({ value: timeString, label: timeString });

    currentTime = new Date(currentTime.getTime() + INTERVAL_MINUTES * 60000);
  }

  return options;
};

// 本体
export const TimeSelect = ({ onTimeChange, testTime }) => {
  // useMemoで計算結果をキャッシュし、不要な再計算を防ぐ
  const now = testTime || new Date();
  const timeOptions = useMemo(() => generateTimeOptions(now), [now]);

  //現在時刻をフォーマット
  const currentHour = String(now.getHours()).padStart(2, "0");
  const currentMinutes = String(now.getMinutes()).padStart(2, "0");
  const formattedTime = `${currentHour}:${currentMinutes}`;

  // ← 修正: render中に onTimeChange を直接呼ばない
  // マウント時 / timeOptions が変わったときに一度だけ呼ぶ
  useEffect(() => {
    if (timeOptions.length > 0 && typeof onTimeChange === "function") {
      try {
        onTimeChange(timeOptions[0].value);
      } catch (e) {
        // 親が同期的にエラーを投げても無視してループを防ぐ
        console.warn("TimeSelect: onTimeChange threw:", e);
      }
    }
    // onTimeChange は通常は安定（setState）だが、念のため依存に入れておく
  }, [timeOptions, onTimeChange]);

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
            onTimeChange(e.target.value);
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

// --- スタイル---

const titleStyle = {
  textAlign: "center",
  fontSize: "22px",
  fontWeight: "bold",
  marginTop: "16px",
};

const containerStyle = {
  padding: "16px",
  fontFamily: "Arial, sans-serif",
  maxWidth: "400px",
  margin: "0 auto",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "16px",
};

const selectStyle = {
  width: "100%",
  padding: "12px",
  fontSize: "18px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  minHeight: "48px",
  appearance: "none",
  WebkitAppearance: "none",
};

const currentTimeStyle = {
  textAlign: "center",
  fontSize: "18px",
  fontWeight: "bold",
  color: "#333",
  marginBottom: "20px",
  padding: "8px",
  backgroundColor: "#eaeaea",
  borderRadius: "4px",
};
