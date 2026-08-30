// 売り切れ情報にセット商品の連動ルールを適用するロジック。
import { PRODUCT_CATEGORIES } from "../../constants/items";
import type { SoldoutMap } from "../../types";

const { PORK_SINGLE, PORK_SINGLE_LARGE, DRINK_SINGLE, PORK_DRINK_SET, PORK_DRINK_SET_LARGE, COLA, ORANGE, CIDER, OOLONG } =
  PRODUCT_CATEGORIES;

export function applySoldoutRules(rawSoldout: SoldoutMap = {}): { soldout: SoldoutMap } {
  const soldout: SoldoutMap = { ...rawSoldout };

  soldout[PORK_DRINK_SET] = Boolean(soldout[PORK_SINGLE]);
  soldout[PORK_DRINK_SET_LARGE] = Boolean(soldout[PORK_SINGLE_LARGE]);

  if (soldout[COLA] && soldout[ORANGE] && soldout[CIDER] && soldout[OOLONG]) {
    soldout[DRINK_SINGLE] = true;
    soldout[PORK_DRINK_SET] = true;
    soldout[PORK_DRINK_SET_LARGE] = true;
  } else {
    soldout[DRINK_SINGLE] = false;
  }

  return { soldout };
}
