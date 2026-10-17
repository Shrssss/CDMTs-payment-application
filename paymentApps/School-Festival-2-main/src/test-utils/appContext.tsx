// テストでページを描画するための AppContext。既定値に、テストごとに必要な値だけ上書きして渡す。
import type { ReactNode } from "react";

import { AppContext, type AppContextValue } from "../context/AppContext";
import { INITIAL_PAYMENT_STATE } from "../constants/initialState";

const noop = () => {};

const createTestAppContext = (overrides: Partial<AppContextValue> = {}): AppContextValue => ({
  step: null,
  goto: noop,
  next: noop,
  prev: noop,
  cart: {},
  dispatch: noop,
  addItems: noop,
  removeItems: noop,
  calculateDifferenceOfDrinks: () => 0,
  calculateSumInMenu: () => 0,
  calculateSumPrice: () => 0,
  selectedTime: null,
  setSelectedTime: noop,
  currentTestTime: false,
  prices: {},
  itemNames: {},
  imagePaths: {},
  isSoldout: {},
  menuFetchError: false,
  refreshMenuItems: noop,
  paymentState: INITIAL_PAYMENT_STATE,
  paymentResultSid: null,
  setPaymentState: noop,
  refreshPaymentStatus: noop,
  leavePaymentResult: noop,
  checkingPaymentStatus: false,
  pendingPaymentNotices: [],
  openPendingPayment: noop,
  savedOrders: [],
  viewSavedOrder: noop,
  isLegalNoticeOpen: false,
  openLegalNotice: noop,
  closeLegalNotice: noop,
  ...overrides,
});

export const TestAppProvider = ({
  value,
  children,
}: {
  value?: Partial<AppContextValue>;
  children: ReactNode;
}) => <AppContext.Provider value={createTestAppContext(value)}>{children}</AppContext.Provider>;
