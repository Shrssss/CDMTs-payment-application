// メニュー(商品名・価格・画像)のモック値。
// メニューモックスイッチ(USE_MOCK_MENU)がオンの時、バックエンドに一切
// 接続せずこの値だけでメニュー画面を表示できるようにするためのもの。
import img_10 from "../../image/img_10.jpg";
import img_20 from "../../image/img_20.jpg";
import img_30 from "../../image/img_30.jpg";
import img_40 from "../../image/img_40.jpg";
import img_50 from "../../image/img_50.jpg";
import img_91 from "../../image/img_91.jpg";
import img_92 from "../../image/img_92.jpg";
import img_93 from "../../image/img_93.jpg";
import img_94 from "../../image/img_94.jpg";
import type { PriceMap, NameMap, ImagePathMap } from "../../types";

export const MOCK_MENU_PRICES: PriceMap = {
  10: 470, // PORK_SINGLE
  20: 670, // PORK_LARGE
  30: 150, // DRINK_SINGLE
  40: 570, // PORK_DRINK_SET
  50: 770, // PORK_DRINK_SET_LARGE
};

export const MOCK_MENU_ITEM_NAMES: NameMap = {
  10: "角煮 単品",
  20: "角煮大盛り 単品",
  30: "ドリンク 単品",
  40: "【お得】角煮ドリンクセット",
  50: "【お得】角煮ドリンクセット大盛り",
  91: "コーラ",
  92: "なっちゃんオレンジ",
  93: "三ツ矢サイダー",
  94: "烏龍茶",
};

export const MOCK_MENU_IMAGE_PATHS: ImagePathMap = {
  10: img_10,
  20: img_20,
  30: img_30,
  40: img_40,
  50: img_50,
  91: img_91,
  92: img_92,
  93: img_93,
  94: img_94,
};
