// アプリ全体の画面遷移と共通レイアウトをまとめるルートコンポーネント。
import "./styles.css";
import { useRef, useState } from "react";

import { Header } from "./components/Header";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useAppFlow } from "./hooks/useAppFlow";
import { useOrderSummary } from "./hooks/useOrderSummary";
import { useMenuItems } from "./hooks/useMenuItems";
import { useOrderSnapshotRestore } from "./hooks/useOrderSnapshotRestore";
import { AppScreenRenderer } from "./AppScreenRenderer";
import { LegalNoticePage } from "./pages/LegalNoticePage";
import { INITIAL_PAYMENT_STATE } from "./constants/initialState";
import { USE_TEST_TIME, TEST_DATE } from "./constants/config";
import { getCurrentTestDate } from "./utils/dateClock";

export const App = () => {
  const appStartTimeRef = useRef(Date.now());
  const [isLegalNoticeOpen, setIsLegalNoticeOpen] = useState(false);

  const currentTestTime: Date | false = USE_TEST_TIME
    ? getCurrentTestDate(appStartTimeRef.current, TEST_DATE)
    : false;

  const {
    state,
    dispatch,
    next,
    prev,
    addItems,
    removeItems,
    selectedTime,
    setSelectedTime,
  } = useAppFlow();
  const { prices, itemNames, imagePaths, isSoldout, fetchError, refreshMenuItems } =
    useMenuItems(state.step);
  const {
    calculateDifferenceOfDrinks,
    calculateSumInMenu,
    calculateSumPrice,
  } = useOrderSummary(state.cart, prices);
  const [paymentState, setPaymentState] = useState(INITIAL_PAYMENT_STATE);
  const { hasSavedOrder, viewSavedOrder } = useOrderSnapshotRestore({
    dispatch,
    setPaymentState,
    setSelectedTime,
  });

  return (
    <>
      <style>{`\n        @keyframes cm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }\n      `}</style>

      <header>
        <Header />
        <div style={{ minHeight: "10px" }}></div>
      </header>

      <ErrorBoundary>
        <AppScreenRenderer
          step={state.step}
          next={next}
          prev={prev}
          cart={state.cart}
          addItems={addItems}
          removeItems={removeItems}
          prices={prices}
          itemNames={itemNames}
          imagePaths={imagePaths}
          isSoldout={isSoldout}
          menuFetchError={fetchError}
          onRetryMenuFetch={refreshMenuItems}
          calculateDifferenceOfDrinks={calculateDifferenceOfDrinks}
          calculateSumInMenu={calculateSumInMenu}
          calculateSumPrice={calculateSumPrice}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          currentTestTime={currentTestTime}
          paymentState={paymentState}
          setPaymentState={setPaymentState}
          dispatch={dispatch}
          onOpenLegalNotice={() => setIsLegalNoticeOpen(true)}
          hasSavedOrder={hasSavedOrder}
          onViewSavedOrder={viewSavedOrder}
        />
      </ErrorBoundary>

      {isLegalNoticeOpen && (
        <LegalNoticePage onClose={() => setIsLegalNoticeOpen(false)} />
      )}
    </>
  );
};
