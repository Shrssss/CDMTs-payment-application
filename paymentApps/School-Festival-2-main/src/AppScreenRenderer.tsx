// 現在の画面状態に応じて各ページコンポーネントを切り替えて描画する補助コンポーネント。
import type { Dispatch, SetStateAction } from "react";
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
import { INITIAL_PAYMENT_STATE } from "./constants/initialState";
import type { Step } from "./constants/steps";
import type {
  AppAction,
  Cart,
  ImagePathMap,
  NameMap,
  OrderSnapshot,
  PaymentState,
  PriceMap,
  SoldoutMap,
} from "./types";

interface AppScreenRendererProps {
  onRefreshPaymentStatus?: () => void;
  onLeavePaymentResult?: () => void;
  checkingPaymentStatus?: boolean;
  step: Step;
  next: () => void;
  prev: () => void;
  cart: Cart;
  addItems: (id: number) => void;
  removeItems: (id: number) => void;
  prices: PriceMap;
  itemNames: NameMap;
  imagePaths: ImagePathMap;
  isSoldout: SoldoutMap;
  menuFetchError: boolean;
  onRetryMenuFetch: () => void;
  calculateDifferenceOfDrinks: () => number;
  calculateSumInMenu: () => number;
  calculateSumPrice: () => number;
  selectedTime: string | null;
  setSelectedTime: Dispatch<SetStateAction<string | null>>;
  currentTestTime: Date | false;
  paymentState: PaymentState;
  setPaymentState: Dispatch<SetStateAction<PaymentState>>;
  dispatch: Dispatch<AppAction>;
  onOpenLegalNotice: () => void;
  savedOrders: OrderSnapshot[];
  onViewSavedOrder: (key: string) => void;
}

type RenderPageProps = Omit<AppScreenRendererProps, "prev" | "calculateSumInMenu" | "calculateSumPrice">;

const renderPage = ({
  onRefreshPaymentStatus,
  onLeavePaymentResult,
  checkingPaymentStatus,
  step,
  next,
  cart,
  addItems,
  removeItems,
  prices,
  itemNames,
  imagePaths,
  isSoldout,
  menuFetchError,
  onRetryMenuFetch,
  calculateDifferenceOfDrinks,
  selectedTime,
  setSelectedTime,
  currentTestTime,
  paymentState,
  setPaymentState,
  dispatch,
  onOpenLegalNotice,
  savedOrders,
  onViewSavedOrder,
}: RenderPageProps) => {
  switch (step) {
    case "title":
      return (
        <TitlePage
          onStart={() => {
            // 過去の注文を表示した後でも、新しい注文は空のカートから始める。
            dispatch({ type: "RESET_CART" });
            next();
          }}
          onOpenLegalNotice={onOpenLegalNotice}
          savedOrders={savedOrders}
          onViewSavedOrder={onViewSavedOrder}
        />
      );
    case "menu":
      return (
        <MenuPage
          prices={prices}
          itemNames={itemNames}
          imagePaths={imagePaths}
          cart={cart}
          addItems={addItems}
          removeItems={removeItems}
          isSoldout={isSoldout}
          fetchError={menuFetchError}
          onRetry={onRetryMenuFetch}
        />
      );
    case "drink":
      return (
        <DrinkPage
          itemNames={itemNames}
          imagePaths={imagePaths}
          cart={cart}
          addItems={addItems}
          removeItems={removeItems}
          difference={calculateDifferenceOfDrinks()}
          isSoldout={isSoldout}
        />
      );
    case "cart":
      return <CartPage cart={cart} price={prices} names={itemNames} />;
    case "time":
      return <TimePage onTimeChange={setSelectedTime} testTime={currentTestTime || null} />;
    case "paymentMethod":
      return <PaymentMethodPage dispatch={dispatch} onOpenLegalNotice={onOpenLegalNotice} />;
    case "payment":
      return (
        <PaymentPage
          dispatch={dispatch}
          setPaymentState={setPaymentState}
          selectedTime={selectedTime}
          cart={cart}
          onOpenLegalNotice={onOpenLegalNotice}
        />
      );
    case "paymentPaypay":
      return (
        <PaymentPayPayPage
          dispatch={dispatch}
          setPaymentState={setPaymentState}
          selectedTime={selectedTime}
          cart={cart}
          onOpenLegalNotice={onOpenLegalNotice}
        />
      );
    case "paymentResult":
      return (
        <PaymentResultPage
          onRefreshPaymentStatus={onRefreshPaymentStatus}
          onLeavePaymentResult={onLeavePaymentResult}
          checkingPaymentStatus={checkingPaymentStatus}
          paymentState={paymentState}
          selectedTime={selectedTime}
          setPaymentState={setPaymentState}
          dispatch={dispatch}
        />
      );
    case "numberTag":
      return (
        <NumberTagPage
          cart={cart}
          price={prices}
          names={itemNames}
          paymentState={paymentState}
          onBackToTitle={() => {
            setPaymentState((prev) => ({ ...prev, outcome: INITIAL_PAYMENT_STATE.outcome }));
            dispatch({ type: "RESET_CART" });
            dispatch({ type: "GOTO", step: "title" });
          }}
        />
      );
    default:
      return null;
  }
};

export const AppScreenRenderer = ({
  onRefreshPaymentStatus,
  onLeavePaymentResult,
  checkingPaymentStatus,
  // 現在の画面状態に応じて各ページコンポーネントを切り替えて描画する補助コンポーネント。
  step,
  next,
  prev,
  cart,
  addItems,
  removeItems,
  prices,
  itemNames,
  imagePaths,
  isSoldout,
  menuFetchError,
  onRetryMenuFetch,
  calculateDifferenceOfDrinks,
  calculateSumInMenu,
  calculateSumPrice,
  selectedTime,
  setSelectedTime,
  currentTestTime,
  paymentState,
  setPaymentState,
  dispatch,
  onOpenLegalNotice,
  savedOrders,
  onViewSavedOrder,
}: AppScreenRendererProps) => {
  return (
    <>
      {renderPage({
        onRefreshPaymentStatus,
        onLeavePaymentResult,
        checkingPaymentStatus,
        step,
        next,
        cart,
        addItems,
        removeItems,
        prices,
        itemNames,
        imagePaths,
        isSoldout,
        menuFetchError,
        onRetryMenuFetch,
        calculateDifferenceOfDrinks,
        selectedTime,
        setSelectedTime,
        currentTestTime,
        paymentState,
        setPaymentState,
        dispatch,
        onOpenLegalNotice,
        savedOrders,
        onViewSavedOrder,
      })}

      {shouldShowFooter(step) && (
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
