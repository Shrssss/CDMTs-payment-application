// メニュー画面から次へ進めるかどうかの判定をまとめるロジック。
import { DRINK_LINKED_ITEM_IDS } from "../../constants/items";
import type { Cart } from "../../types";

export function canProceedFromMenu(cart: Cart): boolean {
  const menuCount = DRINK_LINKED_ITEM_IDS.reduce((sum, id) => sum + (cart[id] || 0), 0);

  return menuCount > 0;
}
