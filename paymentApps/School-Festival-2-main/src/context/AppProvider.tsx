// 状態管理フックをまとめて呼び出し、その結果を AppContext として配下へ配るコンポーネント。
import { useCallback, useRef, useState, type ReactNode } from "react";

import { AppContext, type AppContextValue } from "./AppContext";
import { useAppFlow } from "../hooks/useAppFlow";
import { useOrderSummary } from "../hooks/useOrderSummary";
import { useMenuItems } from "../hooks/useMenuItems";
import { useOrderSnapshotRestore } from "../hooks/useOrderSnapshotRestore";
import { paymentResultSearch, usePaymentReturn } from "../hooks/usePaymentReturn";
import { usePendingPaymentNotices } from "../hooks/usePendingPaymentNotices";
import { INITIAL_PAYMENT_STATE } from "../constants/initialState";
import { USE_TEST_TIME, TEST_DATE } from "../constants/config";
import { getCurrentTestDate } from "../utils/dateClock";

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const appStartTimeRef = useRef(Date.now());
  const [isLegalNoticeOpen, setIsLegalNoticeOpen] = useState(false);

  const currentTestTime: Date | false = USE_TEST_TIME
    ? getCurrentTestDate(appStartTimeRef.current, TEST_DATE)
    : false;

  const {
    step,
    state,
    dispatch,
    goto,
    next,
    prev,
    addItems,
    removeItems,
    selectedTime,
    setSelectedTime,
  } = useAppFlow();
  const { prices, itemNames, imagePaths, isSoldout, fetchError, refreshMenuItems } =
    useMenuItems(step);
  const {
    calculateDifferenceOfDrinks,
    calculateSumInMenu,
    calculateSumPrice,
  } = useOrderSummary(state.cart, prices);
  const [paymentState, setPaymentState] = useState(INITIAL_PAYMENT_STATE);
  const { savedOrders, reloadSavedOrders, viewSavedOrder } = useOrderSnapshotRestore({
    step,
    dispatch,
    goto,
    setPaymentState,
    setSelectedTime,
  });
  const { resultSid, refreshPaymentStatus, leavePaymentResult, checking } = usePaymentReturn({
    step,
    dispatch,
    goto,
    setPaymentState,
    setSelectedTime,
  });
  const pendingPaymentNotices = usePendingPaymentNotices({ step, onOrderHistoryChanged: reloadSavedOrders });
  const openPendingPayment = useCallback(
    (sid: string) => goto("paymentResult", { search: paymentResultSearch(sid) }),
    [goto]
  );

  const openLegalNotice = useCallback(() => setIsLegalNoticeOpen(true), []);
  const closeLegalNotice = useCallback(() => setIsLegalNoticeOpen(false), []);

  const value: AppContextValue = {
    step,
    goto,
    next,
    prev,
    cart: state.cart,
    dispatch,
    addItems,
    removeItems,
    calculateDifferenceOfDrinks,
    calculateSumInMenu,
    calculateSumPrice,
    selectedTime,
    setSelectedTime,
    currentTestTime,
    prices,
    itemNames,
    imagePaths,
    isSoldout,
    menuFetchError: fetchError,
    refreshMenuItems,
    paymentState,
    paymentResultSid: resultSid,
    setPaymentState,
    refreshPaymentStatus,
    leavePaymentResult,
    checkingPaymentStatus: checking,
    pendingPaymentNotices,
    openPendingPayment,
    savedOrders,
    viewSavedOrder,
    isLegalNoticeOpen,
    openLegalNotice,
    closeLegalNotice,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
