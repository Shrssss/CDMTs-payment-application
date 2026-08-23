// フロント -> バックエンドの API 呼び出しラッパー

// WARNING: これはテスト環境用
// WARNING: フロントだけで動くようにFALLBACK
const FALLBACK_SQUARE = {
  applicationId: "sandbox-sq0idb-TSpPtbWlulBoJyV0q3lPgQ",
  locationId: "LKJK1TXBNV3GX",
  environment: "SANDBOX",
};

function isValidAppId(id) {
  if (!id || typeof id !== "string") return false;
  const s = id.trim();
  return /^((sq0idp-|sq0idb-|sandbox-).+)/i.test(s);
}

export const Api = {
  async getSquareConfig() {
    // 1) try /api/square/config expecting JSON
    try {
      const res = await fetch("/api/square/config", {
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
                locationId: loc || FALLBACK_SQUARE.locationId,
                environment: env || FALLBACK_SQUARE.environment,
              };
            } else {
              console.warn(
                "getSquareConfig: invalid applicationId in /api/square/config JSON:",
                appId
              );
            }
          } catch (e) {
            console.warn(
              "getSquareConfig: failed to parse JSON from /api/square/config:",
              e
            );
          }
        } else {
          console.warn(
            "getSquareConfig: /api/square/config returned non-JSON content-type:",
            ctype
          );
        }
      } else {
        console.warn(
          "getSquareConfig: /api/square/config returned not ok:",
          res.status
        );
      }
    } catch (e) {
      console.warn("getSquareConfig: fetch error /api/square/config:", e);
    }

    // 2) fallback to text endpoint if available
    try {
      const res2 = await fetch("/api/payment/get/ApplicationId");
      if (res2.ok) {
        const text = (await res2.text()).trim();
        if (isValidAppId(text)) {
          return {
            applicationId: text,
            locationId: FALLBACK_SQUARE.locationId,
            environment: FALLBACK_SQUARE.environment,
          };
        } else {
          console.warn(
            "getSquareConfig: /api/payment/get/ApplicationId returned invalid id:",
            text
          );
        }
      } else {
        console.warn(
          "getSquareConfig: /api/payment/get/ApplicationId returned not ok:",
          res2.status
        );
      }
    } catch (e) {
      console.warn(
        "getSquareConfig: fetch error /api/payment/get/ApplicationId:",
        e
      );
    }

    // 3) final fallback
    console.warn("getSquareConfig: using FALLBACK_SQUARE (development only)");
    return { ...FALLBACK_SQUARE };
  },

  // 在庫（売切れ）取得:
  // 要求どおり: itemIds = [10,20,91,92,93,94] をループして個別取得する。
  // 各エンドポイント: GET /api/items/get/byitemId/{itemId}
  // 返り値: { soldout: { "<itemId>": true|false, ... } }
  async fetchSoldoutMap() {
    const itemIds = [10, 20, 91, 92, 93, 94];
    const soldout = {};
    for (const id of itemIds) {
      try {
        const res = await fetch(`/api/items/get/byitemId/${id}`);
        if (!res.ok) {
          console.warn(
            `fetchSoldoutMap: failed to fetch item ${id}`,
            res.status
          );
          // サーバがない/エラー時は安全側にして売切れとしない（false）
          soldout[id] = false;
          continue;
        }
        const item = await res.json();
        // backend の Item model に available フィールドがある前提
        soldout[id] = !item?.available; // available=false -> soldout true
      } catch (e) {
        console.warn(`fetchSoldoutMap: network error for item ${id}`, e);
        soldout[id] = false;
      }
    }
    return { soldout };
  },

  // 注文作成: POST /api/order/set
  // 送るボディは backend の OrderRequest DTO に合わせる必要あり。
  // 要件に合わせ、orderDate（作成日時）, reservedTime（LocalDateTime形式）, items（[{itemId,quantity}]）を送る。
  async createOrder({ items, orderDate, reservedTime, amount }) {
    const body = {
      orderDate, // LocalDateTime-ish string "yyyy-MM-dd'T'HH:mm:ss"
      reservedTime, // LocalDateTime-ish string
      items, // array of { itemId, quantity } filtered by buildOrderItems on frontend
      amount,
    };
    const res = await fetch("/api/order/set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      // エラーハンドリングは上位で行う
      const text = await res.text().catch(() => "");
      console.warn("createOrder failed:", res.status, text);
      throw new Error("注文作成に失敗しました");
    }
    return res.json(); // 期待: { orderId, ... }（他フィールドは破壊せずそのまま返す）
  },

  // 決済呼び出し: バックエンド PaymentController に合わせる
  // backend defines: POST /api/payment/create/{orderId}/{sourceId}
  async chargeOrder({
    orderId,
    sourceId,
    items,
    reservedAtIso,
    createdAtIso,
    amount,
  }) {
    // path variables に sourceId を載せる（エンコード必須）
    const url = `/api/payment/create/${orderId}/${encodeURIComponent(
      sourceId
    )}`;
    // PaymentController.createPayment は path variables のみ受け取る実装のため body は不要。
    // サーバで追加の検証が必要ならここで body を渡す（現在は不要）
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("chargeOrder failed:", res.status, text);
      throw new Error("決済APIが失敗しました");
    }
    return res.json(); // { status:"APPROVED"|"DECLINED", receiptUrl?, error? }
  },

  // 注文取得: backend のエンドポイントに合わせる
  // backend has: GET /api/order/get/byorderId/{orderId}
  async fetchOrder(orderId) {
    const res = await fetch(`/api/order/get/byorderId/${orderId}`);
    if (!res.ok) throw new Error("注文取得に失敗しました");
    return res.json();
  },
};
