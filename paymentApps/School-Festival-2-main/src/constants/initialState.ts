// アプリ起動時に使う画面状態と決済状態の初期値を定義するファイル。
import { STEPS } from "./steps";
import { CART_INITIAL } from "./items";
import type { AppState, PaymentState, SoldoutMap } from "../types";

export const INITIAL_APP_STATE: AppState = {
  step: STEPS.TITLE,
  cart: CART_INITIAL,
};

export const INITIAL_PAYMENT_STATE: PaymentState = {
  billingInfo: {
    familyName: "",
    givenName: "",
    email: "",
  },
  outcome: {
    ok: false,
    orderId: null,
    error: null,
    receiptUrl: null,
    displayReserved: null,
  },
};

export interface UiState {
  selectedTime: string | null;
  isSoldout: SoldoutMap;
}

export const INITIAL_UI_STATE: UiState = {
  selectedTime: null,
  isSoldout: {
    10: false,
    20: false,
    30: false,
    40: false,
    50: false,
    91: false,
    92: false,
    93: false,
    94: false,
  },
};
