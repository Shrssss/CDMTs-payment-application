import type { Cart, PaymentMethod } from "../../types";

export const PENDING_PAYMENT_KEY = "cm_pending_payment_v1";

export interface PendingPayment {
  orderId: number;
  sid: string;
  method: PaymentMethod;
  cart: Cart;
  reservedAtIso: string;
  createdAt: string;
}

// 保存できなければ外部送信を止める。カードトークン・連絡先は保存しない。
export function savePendingPayment(pending: PendingPayment): void {
  const { orderId, sid, method, cart, reservedAtIso, createdAt } = pending;
  sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify({
    orderId, sid, method, cart, reservedAtIso, createdAt,
  }));
}

export function readPendingPayment(): PendingPayment | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(PENDING_PAYMENT_KEY) || "null");
    if (!value || !Number.isSafeInteger(value.orderId) || value.orderId <= 0 ||
      typeof value.sid !== "string" || !/^[A-Za-z0-9]{1,16}$/.test(value.sid) ||
      !["card", "paypay"].includes(value.method) ||
      typeof value.reservedAtIso !== "string" || !Number.isFinite(Date.parse(value.reservedAtIso)) ||
      typeof value.createdAt !== "string" || !Number.isFinite(Date.parse(value.createdAt)) ||
      !value.cart || typeof value.cart !== "object" || Array.isArray(value.cart) ||
      !Object.values(value.cart).every(q => Number.isInteger(q) && Number(q) >= 0)) return null;
    return value;
  } catch {
    return null;
  }
}

export function getPaymentReturn(search: string, pending: PendingPayment | null) {
  const params = new URLSearchParams(search);
  const method = params.get("paysys_return");
  if (!method && !pending) return null;
  if (!pending) return { pending: null, error: "元の注文を復元できません。同じブラウザ・タブで開き、注文番号を係員にお伝えください。" };
  if ((method && method !== pending.method) ||
      (params.has("SID") && params.get("SID") !== pending.sid)) {
    return { pending: null, error: "戻り先の取引情報が保存済み注文と一致しません。係員にご確認ください。" };
  }
  const incomplete = params.get("result") === "cancel" || params.get("result") === "error" || params.has("ERROR");
  return { pending, error: incomplete ? "決済手続きが完了していない可能性があります。支払い状況を確認してください。" : null };
}
