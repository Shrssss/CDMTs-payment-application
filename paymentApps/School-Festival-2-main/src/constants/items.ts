// 商品 ID・カート初期値をまとめるファイル。
//
// 商品ID(itemId)とドリンク種別ID(drinkId)は合成しない(旧: セットID+ドリンク
// オフセットでIDを合成するgetDrinkBreakdownId方式は廃止した)。カテゴリ別の
// 個数とドリンク種別ごとの合計数は、それぞれ別のフィールドとして持ち回す。
// どのカテゴリにどのドリンクを割り振るかの計算はバックエンドが行う
// (docs/backend-requirements.md 5番参照)。
import type { Cart } from "../types";

export const PRODUCT_CATEGORIES = {
  // 商品
  PORK_SINGLE: 10,
  PORK_SINGLE_LARGE: 20,
  DRINK_SINGLE: 30, // 単品ドリンク
  PORK_DRINK_SET: 40, // 角煮ドリンクセット
  PORK_DRINK_SET_LARGE: 50, // 角煮ドリンクセット大盛り

  // ドリンク種別
  COLA: 91,
  ORANGE: 92,
  CIDER: 93,
  OOLONG: 94,
} as const;

// ===== ドリンク関連の便利な配列 =====
// PRODUCT_CATEGORIESから導出する(値を再度ハードコードすると、カテゴリ追加時に
// 片方だけ更新し忘れて静かにズレる)。
export const DRINK_TYPE_IDS: number[] = [
  PRODUCT_CATEGORIES.COLA,
  PRODUCT_CATEGORIES.ORANGE,
  PRODUCT_CATEGORIES.CIDER,
  PRODUCT_CATEGORIES.OOLONG,
];

// ===== 注文処理で使う ID 集合 =====
export const PRODUCT_CATEGORY_IDS: number[] = [
  PRODUCT_CATEGORIES.PORK_SINGLE,
  PRODUCT_CATEGORIES.PORK_SINGLE_LARGE,
  PRODUCT_CATEGORIES.DRINK_SINGLE,
  PRODUCT_CATEGORIES.PORK_DRINK_SET,
  PRODUCT_CATEGORIES.PORK_DRINK_SET_LARGE,
];

// 商品1つあたりの最大注文個数(Menu.tsxの数量ボタン上限)。
export const MAX_ITEM_QUANTITY = 9;

// ドリンクの紐付けを必要とする商品(単品ドリンク・セット・大盛りセット)のID一覧。
// 「ドリンク選択画面へ進む必要があるか」(orderEligibility.ts)と
// 「ドリンク選択の過不足」(useOrderSummary.ts)の両方がこの一覧を参照する。
// 以前は同じ3つのIDの合計計算が2箇所に別々にハードコードされており、
// カテゴリを追加・変更した際に片方だけ直し忘れるリスクがあったため統一した。
export const DRINK_LINKED_ITEM_IDS: number[] = [
  PRODUCT_CATEGORIES.DRINK_SINGLE,
  PRODUCT_CATEGORIES.PORK_DRINK_SET,
  PRODUCT_CATEGORIES.PORK_DRINK_SET_LARGE,
];

// 価格・商品名・画像はバックエンド(GET /api/items/get/allItems)から取得する。
// モック値・フォールバック値は src/constants/mocks/menuMock.ts に集約している。

// ===== カート初期値（全 ID を 0 で初期化） =====
export const CART_INITIAL: Cart = {
  // 商品
  10: 0,
  20: 0,

  // セット/ドリンク
  30: 0,
  40: 0,
  50: 0,

  // ドリンク種別
  91: 0,
  92: 0,
  93: 0,
  94: 0,
};
