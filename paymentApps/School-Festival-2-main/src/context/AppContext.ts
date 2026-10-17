// アプリ全体で共有する状態と操作を各ページへ渡す React Context。
// 値は AppProvider.tsx が各フックから組み立てる。ページは useAppContext() で必要なものだけ取り出す。
// components/ 配下の再利用部品は Context を読まず、これまで通り props で受け取る。
import { createContext, useContext, type Dispatch, type SetStateAction } from "react";

import type { Step } from "../constants/steps";
import type {
  AppAction,
  Cart,
  Goto,
  ImagePathMap,
  NameMap,
  OrderSnapshot,
  PaymentState,
  PriceMap,
  SoldoutMap,
} from "../types";

export interface AppContextValue {
  // 画面遷移(useAppFlow)
  step: Step | null;
  goto: Goto;
  next: () => void;
  prev: () => void;

  // カート(useAppFlow / useOrderSummary)
  cart: Cart;
  dispatch: Dispatch<AppAction>;
  addItems: (id: number) => void;
  removeItems: (id: number) => void;
  calculateDifferenceOfDrinks: () => number;
  calculateSumInMenu: () => number;
  calculateSumPrice: () => number;

  // 予約時刻
  selectedTime: string | null;
  setSelectedTime: Dispatch<SetStateAction<string | null>>;
  /** USE_TEST_TIME がオンのときの疑似的な現在時刻。オフなら false。 */
  currentTestTime: Date | false;

  // メニュー(useMenuItems)
  prices: PriceMap;
  itemNames: NameMap;
  imagePaths: ImagePathMap;
  isSoldout: SoldoutMap;
  menuFetchError: boolean;
  refreshMenuItems: () => void;

  // 決済(usePaymentReturn)
  paymentState: PaymentState;
  setPaymentState: Dispatch<SetStateAction<PaymentState>>;
  refreshPaymentStatus: () => void;
  /** 決済結果の確認画面から抜けてタイトルへ戻る(保留注文を破棄する)。 */
  leavePaymentResult: () => void;
  checkingPaymentStatus: boolean;

  // 注文履歴(useOrderSnapshotRestore)
  savedOrders: OrderSnapshot[];
  viewSavedOrder: (key: string) => void;

  // 特定商取引法に基づく表示
  isLegalNoticeOpen: boolean;
  openLegalNotice: () => void;
  closeLegalNotice: () => void;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("useAppContext は AppProvider の内側で使ってください");
  return value;
}
