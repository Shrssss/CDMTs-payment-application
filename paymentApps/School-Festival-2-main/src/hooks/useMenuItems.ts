// 商品(価格・商品名・画像パス)と在庫状況をバックエンドから取得して画面状態として保持するフック。
// menuステップに入るたびに再取得し、最新の価格・在庫状況を反映する。
//
// USE_MOCK_MENUがオンの場合は、バックエンドへ一切接続せず
// constants/mocks/menuMock.ts の値のみを使う(フロントエンドのみで完結する)。
// オフの場合、取得に失敗したら値を補完せず fetchError を立てる
// (呼び出し側が「メニューを取得できませんでした」を表示する想定)。
import { useCallback, useEffect, useState } from "react";

import { Api } from "../services/apiService";
import { applySoldoutRules } from "../features/soldout/soldoutPolicy";
import { USE_MOCK_MENU } from "../constants/config";
import {
  MOCK_MENU_PRICES,
  MOCK_MENU_ITEM_NAMES,
  MOCK_MENU_IMAGE_PATHS,
} from "../constants/mocks/menuMock";
import { INITIAL_UI_STATE } from "../constants/initialState";
import type { ImagePathMap, NameMap, PriceMap, SoldoutMap } from "../types";
import type { Step } from "../constants/steps";

export function useMenuItems(step: Step) {
  // USE_MOCK_MENUがオンの場合は初期値からモック値を使い、
  // 初回描画時に価格未取得の一瞬の表示崩れ(フラッシュ)が起きないようにする。
  const [prices, setPrices] = useState<PriceMap>(USE_MOCK_MENU ? MOCK_MENU_PRICES : {});
  const [itemNames, setItemNames] = useState<NameMap>(
    USE_MOCK_MENU ? MOCK_MENU_ITEM_NAMES : {}
  );
  const [imagePaths, setImagePaths] = useState<ImagePathMap>(
    USE_MOCK_MENU ? MOCK_MENU_IMAGE_PATHS : {}
  );
  const [isSoldout, setIsSoldout] = useState<SoldoutMap>(INITIAL_UI_STATE.isSoldout);
  const [fetchError, setFetchError] = useState(false);

  const refreshMenuItems = useCallback(async () => {
    if (USE_MOCK_MENU) {
      setPrices(MOCK_MENU_PRICES);
      setItemNames(MOCK_MENU_ITEM_NAMES);
      setImagePaths(MOCK_MENU_IMAGE_PATHS);
      setIsSoldout(INITIAL_UI_STATE.isSoldout);
      setFetchError(false);
      return;
    }

    try {
      const items = await Api.fetchAllItems();

      const nextPrices: PriceMap = {};
      const nextItemNames: NameMap = {};
      const nextImagePaths: ImagePathMap = {};
      const rawSoldout: SoldoutMap = {};

      for (const item of items) {
        nextPrices[item.itemId] = item.price;
        nextItemNames[item.itemId] = item.itemName;
        nextImagePaths[item.itemId] = item.imagePath;
        // 明示的に available: false のときだけ売切れ
        rawSoldout[item.itemId] = item?.available === false;
      }

      setPrices(nextPrices);
      setItemNames(nextItemNames);
      setImagePaths(nextImagePaths);
      setIsSoldout(applySoldoutRules(rawSoldout).soldout);
      setFetchError(false);
    } catch (e) {
      console.warn("useMenuItems: fetchAllItems failed", e);
      setFetchError(true);
    }
  }, []);

  useEffect(() => {
    if (step === "menu") {
      refreshMenuItems();
    }
  }, [step, refreshMenuItems]);

  return { prices, itemNames, imagePaths, isSoldout, fetchError, refreshMenuItems };
}
