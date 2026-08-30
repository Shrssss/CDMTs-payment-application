// API エンドポイント
// API 接続先、タイムアウト、Square 設定、予約関連の共通定数をまとめるファイル。
export const API_ENDPOINTS = {
  SQUARE_CONFIG: "/api/square/config",
  ALL_ITEMS: "/api/items/get/allItems",
  ORDER_CREATE: "/api/orders/set",
  PAYMENT_CHARGE: (orderId: string | number, sourceId: string) =>
    `/api/payments/create/${orderId}/${encodeURIComponent(sourceId)}`,
  ORDER_GET: (orderId: string | number) => `/api/order/get/byorderId/${orderId}`,
};

// ⚠️ 未使用(Square廃止に伴い隔離。src/legacy/square/ 以外から参照しないこと)
// タイムアウト・遅延設定(Square SDKのカード取り付け待ち等でのみ使用)
export const TIMEOUTS = {
  CARD_ATTACH_WAIT: 8000, // ms
  CARD_ATTACH_INTERVAL: 50, // ms
  PAYMENT_INIT_DELAY: 500, // ms
  CARD_MOUNT_DELAY: 100, // ms
};

// ⚠️ 未使用(Square廃止に伴い隔離。src/legacy/square/ 以外から参照しないこと)
// リトライ設定(Square SDKのカード取り付けリトライでのみ使用)
export const RETRY_CONFIG = {
  CARD_ATTACH_TRIES: 4,
  CARD_ATTACH_DELAY: 300, // ms
};

// 注文スナップショット（localStorage）設定
export const ORDER_SNAPSHOT_CONFIG = {
  KEY: "cm_order_v1",
  RESERVATION_VALID_DURATION_MS: 60 * 60 * 1000, // 1時間
};

// ⚠️ 未使用(Square廃止に伴い隔離。src/legacy/square/ 以外から参照しないこと)
// Square SDK 環境
export const SQUARE_ENVIRONMENT = {
  PRODUCTION: "PRODUCTION",
  SANDBOX: "SANDBOX",
} as const;

// ⚠️ 未使用(Square廃止に伴い隔離。src/legacy/square/ 以外から参照しないこと)
// Square SDK URLs（環境キーでアクセス）
export const SQUARE_SDK_URLS: Record<string, string> = {
  PRODUCTION: "https://web.squarecdn.com/v1/square.js",
  SANDBOX: "https://sandbox.web.squarecdn.com/v1/square.js",
};

// ⚠️ 未使用(Square廃止に伴い隔離。src/legacy/square/ 以外から参照しないこと)
// Square の fallback 設定は環境変数から読む。
export const SQUARE_FALLBACK_CONFIG = {
  applicationId: import.meta.env.VITE_SQUARE_APP_ID || "",
  locationId: import.meta.env.VITE_SQUARE_LOCATION_ID || "",
  environment: (import.meta.env.VITE_SQUARE_ENV || "SANDBOX").toUpperCase(),
};

// 予約時間設定
export const RESERVATION_CONFIG = {
  START_OFFSET_MINUTES: 10,
  LAST_ORDER_HOUR: 17,
  LAST_ORDER_MINUTE: 10,
  INTERVAL_MINUTES: 5,
};

// テスト用固定値
export const TEST_DATE = new Date(2025, 8, 22, 12, 0, 0);
export const TEMP_STORAGE_TEST_KEY = "__cm_storage_test";

// ⚠️⚠️⚠️ 本番環境では、以下のモックスイッチ(USE_MOCK_PAYMENT / USE_TEST_TIME /
// USE_MOCK_MENU)を必ず全てオフ(false)にすること。オンのままだと、決済・時刻・
// メニューのいずれかが実際のバックエンドに接続されず、モックの値で動作してしまう。
// 本番用の .env.production では、この3つとも false になっていることを確認すること。
const parseBooleanEnv = (value: string | undefined, defaultValue = false): boolean => {
  if (value == null || value === "") {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

export const USE_MOCK_PAYMENT = parseBooleanEnv(
  import.meta.env.VITE_USE_MOCK_PAYMENT,
  true
);
export const USE_TEST_TIME = parseBooleanEnv(
  import.meta.env.VITE_USE_TEST_TIME,
  true
);
// メニュー(価格・商品名・画像)をバックエンドへ接続せず、モック値(constants/mocks/menuMock.ts)
// のみで表示するかどうかのスイッチ。
export const USE_MOCK_MENU = parseBooleanEnv(
  import.meta.env.VITE_USE_MOCK_MENU,
  true
);
