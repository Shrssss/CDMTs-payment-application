// フロント -> バックエンドの API 呼び出しラッパー。
// フロントからバックエンドへ送る API 通信だけをまとめるラッパー。
// Square 設定、売り切れ取得、注文作成、決済、注文取得をこの 1 ファイルに集約する。

import { API_ENDPOINTS, SQUARE_FALLBACK_CONFIG } from "../constants/config";
import type { MenuItemResponse, PaymentApiResponse, SquareConfig } from "../types";

function isValidAppId(id: unknown): id is string {
  if (!id || typeof id !== "string") return false;
  const s = id.trim();
  return /^((sq0idp-|sq0idb-|sandbox-).+)/i.test(s);
}

export const Api = {
  // ⚠️ 未使用(Square廃止に伴い隔離。src/legacy/square/ 以外から呼び出さないこと)
  // Square の applicationId / locationId / environment を取得する。
  async getSquareConfig({
    useMockPayment = false,
  }: { useMockPayment?: boolean } = {}): Promise<SquareConfig> {
    try {
      const res = await fetch(API_ENDPOINTS.SQUARE_CONFIG, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const ctype = (res.headers.get("content-type") || "").toLowerCase();
        if (ctype.includes("application/json")) {
          try {
            const cfg = await res.json();
            const appId = (cfg?.applicationId ?? "").toString().trim();
            const loc = (cfg?.locationId ?? "").toString().trim();
            const env = (cfg?.environment ?? "").toString().trim();
            if (isValidAppId(appId)) {
              return {
                applicationId: appId,
                locationId: loc || SQUARE_FALLBACK_CONFIG.locationId,
                environment: env || SQUARE_FALLBACK_CONFIG.environment,
              };
            } else {
              console.warn(
                "getSquareConfig: invalid applicationId in /api/square/config JSON:",
                appId
              );
              if (!useMockPayment) {
                throw new Error("Square設定の取得に失敗しました");
              }
            }
          } catch (e) {
            console.warn("getSquareConfig: failed to parse JSON from /api/square/config:", e);
            if (!useMockPayment) {
              // Error.causeはtsconfig.jsonのlib(ES2020)では型定義上使えない
              // (ES2022.Error相当が必要)。この関数自体が未使用のSquareコード
              // 専用のため、lib引き上げは行わずこの1箇所だけ許容する。
              // eslint-disable-next-line preserve-caught-error
              throw new Error("Square設定の取得に失敗しました");
            }
          }
        } else {
          console.warn(
            "getSquareConfig: /api/square/config returned non-JSON content-type:",
            ctype
          );
          if (!useMockPayment) {
            throw new Error("Square設定の取得に失敗しました");
          }
        }
      } else {
        console.warn("getSquareConfig: /api/square/config returned not ok:", res.status);
        if (!useMockPayment) {
          throw new Error("Square設定の取得に失敗しました");
        }
      }
    } catch (e) {
      console.warn("getSquareConfig: fetch error /api/square/config:", e);
      if (!useMockPayment) {
        throw e instanceof Error ? e : new Error("Square設定の取得に失敗しました");
      }
    }

    // 2) 最後はフロント内 fallback で継続する。
    console.warn("getSquareConfig: using SQUARE_FALLBACK_CONFIG (development only)");
    return { ...SQUARE_FALLBACK_CONFIG };
  },

  // 全商品(価格・商品名・画像パス・在庫状況)を取得する。
  // エンドポイント: GET /api/items/get/allItems
  // 返り値: [{ itemId, itemName, price, imagePath, available }, ...]
  async fetchAllItems(): Promise<MenuItemResponse[]> {
    const res = await fetch(API_ENDPOINTS.ALL_ITEMS);
    if (!res.ok) {
      throw new Error("商品情報の取得に失敗しました");
    }
    return res.json();
  },

  // 注文を作成する。
  // 注文作成: POST /api/orders/set
  // 送るボディは backend の OrderCreateRequest DTO に合わせる必要あり。
  // orderDate（作成日時）, reservedTime（LocalDateTime形式）, items（[{itemId,quantity}]）,
  // servingStatus（@NotNull、初期値0=調理待ち）, paymentStatus（@NotNull、初期値false=未決済）を送る。
  // drinkCounts（ドリンク種別ごとの合計数、{drinkId: count}）は
  // docs/backend-requirements.md 5番で提案中の新フィールド。
  // バックエンド側がまだ対応していない場合、この項目は無視される想定。
  // レスポンスは素の Long（例: 42）がそのまま返る。
  async createOrder({
    items,
    drinkCounts = {},
    orderDate,
    reservedTime,
    servingStatus = 0,
    paymentStatus = false,
  }: {
    items: { itemId: number; quantity: number }[];
    drinkCounts?: Record<number, number>;
    orderDate: string;
    reservedTime: string;
    servingStatus?: number;
    paymentStatus?: boolean;
  }): Promise<number> {
    const body = {
      orderDate, // LocalDateTime-ish string "yyyy-MM-dd'T'HH:mm:ss"
      reservedTime, // LocalDateTime-ish string
      items, // array of { itemId, quantity } filtered by buildOrderItems on frontend
      drinkCounts, // { drinkId: count } ドリンク割り振りはバックエンドが行う想定
      servingStatus,
      paymentStatus,
    };
    const res = await fetch(API_ENDPOINTS.ORDER_CREATE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("createOrder failed:", res.status, text);
      throw new Error("注文作成に失敗しました");
    }
    return res.json(); // 素の orderId(Long)
  },

  // ⚠️ 未使用(Square廃止に伴い隔離。src/legacy/square/ 以外から呼び出さないこと)
  // Square の sourceId を使って決済を実行する。
  // backend defines: POST /api/payments/create/{orderId}/{sourceId}
  async chargeOrder({
    orderId,
    sourceId,
  }: {
    orderId: string | number;
    sourceId: string;
  }): Promise<PaymentApiResponse> {
    const url = API_ENDPOINTS.PAYMENT_CHARGE(orderId, sourceId);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("chargeOrder failed:", res.status, text);
      throw new Error("決済APIが失敗しました");
    }
    return res.json(); // backend PaymentResponse: { paymentId, status, amount, currency, hasKeyError }
  },

  // ⚠️ 現状どこからも呼ばれていない(未使用)。「注文を確認する」機能は現状
  // localStorageベースで、このAPIを経由しない(src/features/order/orderSnapshot.ts
  // 参照)。パス(単数形"order"。ORDER_CREATE/ORDER_GET以外のエンドポイントは
  // すべて複数形"orders")もバックエンドの実装に対して未検証のままの想定であり、
  // このコメントの元ネタである仕様書上の記載を鵜呑みにしているだけの状態。
  // 実際に使う際は、まずバックエンドの実ルートを確認すること。
  async fetchOrder(orderId: string | number) {
    const res = await fetch(API_ENDPOINTS.ORDER_GET(orderId));
    if (!res.ok) throw new Error("注文取得に失敗しました");
    return res.json();
  },
};
