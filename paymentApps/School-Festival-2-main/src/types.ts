// アプリ全体で共有するドメイン型の定義。
import type { Step } from "./constants/steps";

/** 商品ID/ドリンク種別IDをキーとした数量マップ。 */
export type Cart = Record<number, number>;

export type PriceMap = Record<number, number>;
export type NameMap = Record<number, string>;
export type ImagePathMap = Record<number, string>;
export type SoldoutMap = Record<number, boolean>;

export interface AppState {
  step: Step;
  cart: Cart;
}

export type AppAction =
  | { type: "GOTO"; step: Step }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "CHANGE_ITEM_QUANTITY"; itemId: number; delta: number }
  | { type: "CLEAR_TEMPORARY_DRINKS" }
  | { type: "REPLACE_CART"; cart: Cart };

export interface BillingInfo {
  familyName: string;
  givenName: string;
  email: string;
}

export interface PaymentOutcome {
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

/** buildOrderItems() が組み立てる、バックエンドへ送る注文データの形。 */
export interface OrderItemsPayload {
  items: { itemId: number; quantity: number }[];
  drinkCounts: Record<number, number>;
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
