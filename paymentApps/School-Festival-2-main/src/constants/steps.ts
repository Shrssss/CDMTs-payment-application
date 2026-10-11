// 画面遷移の順序と各ステップ名を定義するファイル。
export const STEPS = {
  TITLE: "title",
  MENU: "menu",
  DRINK: "drink",
  CART: "cart",
  TIME: "time",
  PAYMENT_METHOD: "paymentMethod",
  PAYMENT: "payment",
  PAYMENT_PAYPAY: "paymentPaypay",
  PAYMENT_RESULT: "paymentResult",
  NUMBER_TAG: "numberTag",
} as const;

export type Step = (typeof STEPS)[keyof typeof STEPS];

export const STEPS_ARRAY: Step[] = Object.values(STEPS);
