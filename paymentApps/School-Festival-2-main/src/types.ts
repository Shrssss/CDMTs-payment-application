// アプリ全体で共有するドメイン型の定義。
import type { Step } from "./constants/steps";

/** 商品ID/ドリンク種別IDをキーとした数量マップ。 */
export type Cart = Record<number, number>;

export type PriceMap = Record<number, number>;
export type NameMap = Record<number, string>;
export type ImagePathMap = Record<number, string>;
export type SoldoutMap = Record<number, boolean>;

export interface AppState {
  cart: Cart;
}

/**
 * 画面遷移(URLの切り替え)。replace: true なら履歴を増やさない。
 * search は画面に渡すクエリ(例: "?sid=0123456789abcdef")。
 */
export type Goto = (step: Step, options?: { replace?: boolean; search?: string }) => void;

export type AppAction =
  | { type: "CHANGE_ITEM_QUANTITY"; itemId: number; delta: number }
  | { type: "CLEAR_TEMPORARY_DRINKS" }
  | { type: "REPLACE_CART"; cart: Cart }
  | { type: "RESET_CART" };

export interface BillingInfo {
  familyName: string;
  givenName: string;
  email: string;
}

export interface PaymentOutcome {
  status?: "WAITING" | "PAID" | "UNRESOLVED";
  ok: boolean;
  orderId: string | number | null;
  error: string | null;
  receiptUrl: string | null;
  displayReserved: string | null;
}

export interface PaymentState {
  billingInfo?: BillingInfo;
  outcome: PaymentOutcome;
  phase?: "input" | undefined;
  cardAttached?: boolean;
}
/** 両決済の準備を行うAPIのレスポンス形。 */
export interface PaymentPrepareResponse {
  orderId: number;
  sid: string;
  amount: number;
  action: string;
  fields: Record<string, string>;
}
/** buildOrderItems() が組み立てる、バックエンドへ送る注文データの形。 */
export interface OrderItemsPayload {
  items: { itemId: number; quantity: number }[];
}

/** ⚠️ 未使用(Square廃止に伴い隔離)。GET /api/square/config のレスポンス形。 */
export interface SquareConfig {
  applicationId: string;
  locationId: string;
  environment: string;
}

/** GET /api/items/get/allItems の1件分のレスポンス形。 */
export interface MenuItemResponse {
  itemId: number;
  itemName: string;
  price: number;
  imagePath: string;
  available: boolean;
}

/** ⚠️ 未使用(Square廃止に伴い隔離)。POST /api/payments/create/... のレスポンス形。 */
export interface PaymentApiResponse {
  paymentId?: string;
  status?: string;
  amount?: number;
  currency?: string;
  hasKeyError?: boolean;
  error?: string;
  receiptUrl?: string;
}

/** localStorageへ保存する注文スナップショットの形(orderSnapshot.ts参照)。 */
export interface OrderSnapshot {
  createdAt: string;
  reservedAtIso: string;
  orderId: string | number | null;
  itemsCart: Cart;
  displayReserved: string | null;
}

/** 照合ID(SID)からバックエンドで復元した注文(GET /api/payments/return/{sid})。 */
export interface PaymentReturnOrder {
  orderId: number;
  state: "WAITING" | "PAID";
  /** 注文日時(バックエンドの LocalDateTime 文字列。タイムゾーンなし)。 */
  createdAt: string;
  /** 受取予定日時(同上)。 */
  reservedAt: string;
  cart: Cart;
}

/** タイトル画面に出す「支払いを確認できていない注文」。照会に失敗した場合は orderId 等が null。 */
export interface PendingPaymentNotice {
  sid: string;
  orderId: number | null;
  displayReserved: string | null;
}

/** 決済手段の型。 */
export type PaymentMethod = "card" | "paypay";
