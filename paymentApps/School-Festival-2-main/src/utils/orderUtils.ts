// 注文アイテムの整形、予約時刻変換、表示用フォーマットを扱うユーティリティ。
import { PRODUCT_CATEGORY_IDS, DRINK_TYPE_IDS } from "../constants/items";
import type { Cart, OrderItemsPayload } from "../types";

// バックエンドへ送る注文データを組み立てる。
// バックエンドの設計(ORDER_ITEM_TABLE は itemId と quantity のみ)に合わせ、
// 商品カテゴリもドリンク種別も同じ {itemId, quantity} の明細として送る。
// ドリンク種別(91-94)は ITEM_TABLE に価格0円の商品として登録されている前提
// (未登録だと外部キー制約で注文作成が失敗し、0円でないと料金が二重に加算される)。
export const buildOrderItems = (cart: Cart): OrderItemsPayload => {
  const items = [...PRODUCT_CATEGORY_IDS, ...DRINK_TYPE_IDS].map((itemId) => ({
    itemId,
    quantity: Number(cart[itemId]) || 0,
  })).filter(({ quantity }) => quantity > 0);

  return { items };
};

/** Date → "HH:mm"（予約なしは null） */
export const formatReservedTimeHHmm = (
  dateOrNull: Date | string | null | undefined
): string | null => {
  if (!dateOrNull) return null;
  const d = new Date(dateOrNull);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
};

/**
 * "HH:mm" or ISO文字列 → Date。
 * "HH:mm"形式の場合、baseDate(省略時は現在時刻)の年月日に時刻を当てはめる。
 * 以前はほぼ同じロジックがsrc/features/order/orderSnapshot.tsの
 * parseReservedFromSaved()にも重複して存在していたが、この関数に統合した
 * (localStorageから復元した予約日時を、作成日時を基準に解釈したい場合は
 * baseDateに作成日時のDateを渡す)。
 */
export const parseReservedToDate = (
  value: string | null | undefined,
  baseDate: Date = new Date()
): Date | null => {
  if (!value) return null;

  // ISO文字列などDateがそのまま解釈できる形式を優先して試す。
  // "HH:mm"のような日付を含まない文字列はDateの仕様上ここでは解釈されない
  // (Invalid Dateになる)ため、下のHH:mm分岐へ正しくフォールスルーする。
  const byIso = new Date(value);
  if (!isNaN(byIso.getTime())) return byIso;

  // "HH:mm" をbaseDateの日付として扱う。範囲外の値(例: "99:99")は無効とする。
  const m = String(value).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
};
