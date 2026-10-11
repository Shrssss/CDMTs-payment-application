// カート集計や数量差分を計算して画面表示用の数値を返すフック。
import { useCallback } from "react";

import { PRODUCT_CATEGORY_IDS, DRINK_TYPE_IDS, DRINK_LINKED_ITEM_IDS } from "../constants/items";
import type { Cart, PriceMap } from "../types";

export function useOrderSummary(cart: Cart, prices: PriceMap) {
  const calculateNumberOfDrinksInMenu = useCallback(() => {
    return DRINK_LINKED_ITEM_IDS.reduce((sum, id) => sum + (cart[id] || 0), 0);
  }, [cart]);

  const calculateNumberOfDrinksInDrink = useCallback(() => {
    return DRINK_TYPE_IDS.reduce((sum, id) => sum + (cart[id] || 0), 0);
  }, [cart]);

  const calculateDifferenceOfDrinks = useCallback(() => {
    return calculateNumberOfDrinksInMenu() - calculateNumberOfDrinksInDrink();
  }, [calculateNumberOfDrinksInMenu, calculateNumberOfDrinksInDrink]);

  const calculateSumInMenu = useCallback(() => {
    return PRODUCT_CATEGORY_IDS.reduce((sum, itemId) => sum + (cart[itemId] || 0), 0);
  }, [cart]);

  const calculateSumPrice = useCallback(() => {
    return PRODUCT_CATEGORY_IDS.reduce(
      (sum, itemId) => sum + (prices[itemId] || 0) * (cart[itemId] || 0),
      0
    );
  }, [cart, prices]);

  return {
    calculateNumberOfDrinksInMenu,
    calculateNumberOfDrinksInDrink,
    calculateDifferenceOfDrinks,
    calculateSumInMenu,
    calculateSumPrice,
  };
}
