// 画面(ステップ)名と、各画面のURLを定義するファイル。
// 画面遷移は react-router(HashRouter)で行うため、URLは実際には「/#/menu」のような形になる。
// 決済代行(Paysys)からの戻りURLは「/?paysys_return=...」でハッシュを持たないため、
// まずタイトル(/)に着地し、usePaymentReturn が決済結果画面へ移す。
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

export const STEP_PATHS: Record<Step, string> = {
  title: "/",
  menu: "/menu",
  drink: "/drink",
  cart: "/cart",
  time: "/time",
  paymentMethod: "/payment",
  payment: "/payment/card",
  paymentPaypay: "/payment/paypay",
  paymentResult: "/payment/result",
  numberTag: "/number-tag",
};

/** URLのパスから画面を引く。どの画面にも当たらなければ null。 */
export const stepFromPath = (pathname: string): Step | null => {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return STEPS_ARRAY.find((step) => STEP_PATHS[step] === normalized) ?? null;
};
