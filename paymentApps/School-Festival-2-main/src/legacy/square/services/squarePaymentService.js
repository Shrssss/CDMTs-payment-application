// ⚠️ 未使用(Square廃止に伴い隔離。importしないこと)
// Square SDK の読み込みと環境に応じたスクリプト制御を担当するサービス。
import { SQUARE_ENVIRONMENT, SQUARE_SDK_URLS } from "../../../constants/config";

export async function loadSquareSdk(env = SQUARE_ENVIRONMENT.PRODUCTION) {
  const id = "square-web-payments-sdk";
  if (document.getElementById(id)) return;

  const script = document.createElement("script");
  script.id = id;
  script.src = SQUARE_SDK_URLS[env];
  script.async = true;

  await new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = () => reject(new Error("Square SDKの読み込みに失敗しました"));
    document.head.appendChild(script);
  });
}

export async function createCardSourceId({ applicationId, locationId }) {
  if (!window.Square) throw new Error("Square SDKが読み込まれていません");
  if (!applicationId) throw new Error("applicationId が未設定です");
  if (!locationId) throw new Error("locationId が未設定です");

  const payments = window.Square.payments(applicationId, locationId);
  const card = await payments.card();
  await card.attach("#card-container");

  const result = await card.tokenize();
  if (result.status !== "OK") {
    const msg = result.errors?.[0]?.message || "カードのトークン化に失敗しました";
    throw new Error(msg);
  }
  return result.token;
}