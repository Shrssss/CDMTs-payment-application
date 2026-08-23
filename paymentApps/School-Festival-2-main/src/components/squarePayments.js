// src/squarePayments.js
export async function loadSquareSdk() {
  const id = "square-web-payments-sdk";
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.src = "https://web.squarecdn.com/v1/square.js";
  script.async = true;
  await new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = () =>
      reject(new Error("Square SDKの読み込みに失敗しました"));
    document.head.appendChild(script);
  });
}

// Cardを作ってtokenize（sourceId 発行）
export async function createCardSourceId({ applicationId, locationId }) {
  if (!window.Square) throw new Error("Square SDKが読み込まれていません");
  if (!applicationId) throw new Error("applicationId が未設定です");
  if (!locationId) throw new Error("locationId が未設定です");

  const payments = window.Square.payments(applicationId, locationId);
  const card = await payments.card();
  await card.attach("#card-container"); // App.jsxのpayment画面に<div id="card-container" />が必要

  const result = await card.tokenize();
  if (result.status !== "OK") {
    const msg =
      result.errors?.[0]?.message || "カードのトークン化に失敗しました";
    throw new Error(msg);
  }
  return result.token; // これが sourceId
}
