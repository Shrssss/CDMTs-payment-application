// URL と各ページコンポーネントの対応(ルーティング)をまとめるコンポーネント。
// URL の一覧は constants/steps.ts の STEP_PATHS。各ページは必要な状態を useAppContext() から読む。
import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router";
import { Footer } from "./components/Footer";
import { TitlePage } from "./pages/TitlePage";
import { MenuPage } from "./pages/MenuPage";
import { DrinkPage } from "./pages/DrinkPage";
import { CartPage } from "./pages/CartPage";
import { TimePage } from "./pages/TimePage";
import { PaymentMethodPage } from "./pages/PaymentMethodPage";
import { PaymentPage } from "./pages/PaymentPage";
import { PaymentPayPayPage } from "./pages/PaymentPayPayPage";
import { PaymentResultPage } from "./pages/PaymentResultPage";
import { NumberTagPage } from "./pages/NumberTagPage";
import { shouldShowFooter } from "./constants/stepRules";
import { STEP_PATHS, type Step } from "./constants/steps";
import { useAppContext } from "./context/AppContext";

export const AppScreenRenderer = () => {
  const {
    step,
    next,
    prev,
    selectedTime,
    currentTestTime,
    paymentState,
    calculateDifferenceOfDrinks,
    calculateSumInMenu,
    calculateSumPrice,
  } = useAppContext();

  // URLを直接開いた・ブラウザの戻るで来た等で、その画面に必要な状態がないときの戻し先。
  // 状態はメモリ上にしかないため、再読込するとここで手前の画面へ戻る。
  const { outcome } = paymentState;
  const hasProducts = calculateSumInMenu() > 0;
  const hasOutcome =
    outcome.ok || outcome.orderId != null || outcome.error != null || outcome.status != null;
  const needsOrder: Step | null = hasProducts ? null : "menu";
  const needsReservation: Step | null = needsOrder ?? (selectedTime ? null : "time");

  const guard = (redirect: Step | null, page: ReactElement) =>
    redirect ? <Navigate to={STEP_PATHS[redirect]} replace /> : page;

  return (
    <>
      <Routes>
        <Route path={STEP_PATHS.title} element={<TitlePage />} />
        <Route path={STEP_PATHS.menu} element={<MenuPage />} />
        <Route path={STEP_PATHS.drink} element={guard(needsOrder, <DrinkPage />)} />
        <Route path={STEP_PATHS.cart} element={guard(needsOrder, <CartPage />)} />
        <Route path={STEP_PATHS.time} element={guard(needsOrder, <TimePage />)} />
        <Route path={STEP_PATHS.paymentMethod} element={guard(needsReservation, <PaymentMethodPage />)} />
        <Route path={STEP_PATHS.payment} element={guard(needsReservation, <PaymentPage />)} />
        <Route path={STEP_PATHS.paymentPaypay} element={guard(needsReservation, <PaymentPayPayPage />)} />
        <Route path={STEP_PATHS.paymentResult} element={guard(hasOutcome ? null : "title", <PaymentResultPage />)} />
        <Route path={STEP_PATHS.numberTag} element={guard(outcome.ok ? null : "title", <NumberTagPage />)} />
        <Route path="*" element={<Navigate to={STEP_PATHS.title} replace />} />
      </Routes>

      {step && shouldShowFooter(step) && (
        <footer>
          <Footer
            sumPrice={calculateSumPrice()}
            prev={prev}
            next={next}
            currentStep={step}
            testTime={currentTestTime || null}
            numOfChosenMenu={calculateSumInMenu()}
            difference={calculateDifferenceOfDrinks()}
          />
        </footer>
      )}
    </>
  );
};
