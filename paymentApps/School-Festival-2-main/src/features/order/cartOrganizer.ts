// ⚠️ 現在アクティブなフローからは呼び出されていない(useAppFlow.jsからは
// dispatchされない)。ドリンクをどのカテゴリ(セット/大盛りセット/単品)に
// 割り振るかの計算はバックエンドが行う方針になったため(docs/backend-
// requirements.md 5番参照)、フロント側でこの計算をする必要がなくなった。
// 削除はせず、割り振りアルゴリズムの参考実装として残している
// (バックエンド側の実装時の参考、または将来フロント側で再度必要になった
// 場合のため)。
import { PRODUCT_CATEGORIES, DRINK_TYPE_IDS } from "../../constants/items";
import type { Cart } from "../../types";

// 内訳ID(旧設計。実商品としては扱わない): 30の内訳=31-34, 40の内訳=41-44, 50の内訳=51-54
const LEGACY_DRINK_SUBITEM_IDS = [31, 32, 33, 34, 41, 42, 43, 44, 51, 52, 53, 54];

// カート内のドリンク数量をセット内訳へ振り分ける注文整形ロジック。
export function organizeCart(cart: Cart): Cart {
  const newCart: Cart = { ...cart };
  let sumM = newCart[PRODUCT_CATEGORIES.PORK_DRINK_SET] || 0;
  let sumL = newCart[PRODUCT_CATEGORIES.PORK_DRINK_SET_LARGE] || 0;

  for (const breakdownId of LEGACY_DRINK_SUBITEM_IDS) {
    newCart[breakdownId] = 0;
  }

  for (const drinkTypeId of DRINK_TYPE_IDS) {
    const drinkNo = drinkTypeId % 10;
    let qty = newCart[drinkTypeId] || 0;

    const takeM = Math.min(qty, sumM);
    if (takeM > 0) {
      const target = PRODUCT_CATEGORIES.PORK_DRINK_SET + drinkNo;
      newCart[target] = (newCart[target] || 0) + takeM;
      sumM -= takeM;
      qty -= takeM;
    }

    const takeL = Math.min(qty, sumL);
    if (takeL > 0) {
      const target = PRODUCT_CATEGORIES.PORK_DRINK_SET_LARGE + drinkNo;
      newCart[target] = (newCart[target] || 0) + takeL;
      sumL -= takeL;
      qty -= takeL;
    }

    if (qty > 0) {
      const target = PRODUCT_CATEGORIES.DRINK_SINGLE + drinkNo;
      newCart[target] = (newCart[target] || 0) + qty;
    }
  }

  return newCart;
}
