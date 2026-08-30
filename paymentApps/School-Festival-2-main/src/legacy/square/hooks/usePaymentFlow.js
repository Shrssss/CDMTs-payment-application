// ⚠️ 未使用(Square廃止に伴い隔離。importしないこと)
// 決済導線はSquareを完全廃止し、PaySys(モックのみ、実装は後任)に一本化された。
// このファイルは削除せず参考として残しているが、どこからも呼び出してはならない。
// 決済画面の初期化、カード接続、送信、結果更新をまとめて扱うフック。
import { useCallback, useEffect, useRef, useState } from "react";

import { INITIAL_PAYMENT_STATE } from "../../../constants/initialState";
import {
  ORDER_SNAPSHOT_CONFIG,
  TIMEOUTS,
  TEMP_STORAGE_TEST_KEY,
  USE_MOCK_PAYMENT,
} from "../../../constants/config";
import { Api } from "../../../services/apiService";
import { loadSquareSdk } from "../services/squarePaymentService";
import {
  getLocalStorageJSON,
  removeLocalStorageItem,
  setLocalStorageJSON,
} from "../../../utils/localStorage";
import { formatDisplayReserved } from "../../../utils/dateFormat";
import { buildVerificationDetails } from "../features/payment/paymentValidation";
import { buildOrderSnapshot } from "../../../features/order/orderSnapshot";
import { createPaymentOrder } from "../../../features/payment/paymentSession";
import { parseReservedToDate } from "../../../utils/orderUtils";
import {
  ensurePaymentCardMounted,
  submitPaymentTransaction,
} from "../features/payment/paymentGateway";
import { initializePaymentScreen } from "../features/payment/paymentScreen";

export function usePaymentFlow({ step, cart, selectedTime, dispatch, calculateSumPrice }) {
  const [paymentState, setPaymentState] = useState(INITIAL_PAYMENT_STATE);
  const screenInitTimerRef = useRef(null);
  const cardMountTimerRef = useRef(null);
  const cardRef = useRef(null);

  const setPaymentOutcome = useCallback(
    ({ ok, orderId, error, receiptUrl, displayReserved }) => {
      setPaymentState((prev) => ({
        ...prev,
        outcome: { ok, orderId, error, receiptUrl, displayReserved },
      }));
    },
    []
  );

  const handlePaymentInitializationFailure = useCallback(
    (error, fallbackMessage) => {
      alert(error?.message || fallbackMessage);
      dispatch({ type: "GOTO", step: "cart" });
    },
    [dispatch]
  );

  const clearCardContainer = useCallback(() => {
    const el = document.getElementById("card-container");
    if (el) el.innerHTML = "";
  }, []);

  const destroyCardIfAny = useCallback(async () => {
    try {
      if (cardRef.current && typeof cardRef.current.destroy === "function") {
        await cardRef.current.destroy();
      }
    } catch (_) {
      // no-op: すでに破棄済み等は無視する
    } finally {
      cardRef.current = null;
      clearCardContainer();
      setPaymentState((prev) => ({ ...prev, cardAttached: false }));
    }
  }, [clearCardContainer]);

  const canUseLocalStorage = useCallback(async () => {
    try {
      const key = TEMP_STORAGE_TEST_KEY;
      setLocalStorageJSON(key, "1");
      const v = getLocalStorageJSON(key);
      removeLocalStorageItem(key);
      return v === "1";
    } catch {
      return false;
    }
  }, []);

  // 注文作成タイミング: 決済画面に入った瞬間ではなく、カードのトークン化が成功し
  // 実際に課金する直前に行う。画面を表示しただけでは何も作成されないため、
  // カートに戻る・リロードしても幽霊注文が発生しない。
  const handleSubmitOrderFlow = useCallback(async () => {
    if (!(await canUseLocalStorage())) {
      throw new Error("このブラウザでは注文情報の保存ができません。");
    }

    const reservedDate = parseReservedToDate(selectedTime);
    if (!reservedDate) {
      throw new Error("予約時刻が不正です");
    }

    const createdAtIso = new Date().toISOString();
    const reservedAtIso = reservedDate.toISOString();
    const amount = calculateSumPrice();

    let orderId = null;
    try {
      const orderSession = await createPaymentOrder({
        cart,
        selectedTime,
        calculateSumPrice,
        useMockPayment: USE_MOCK_PAYMENT,
        createOrder: Api.createOrder,
        createdAtIso,
      });
      orderId = orderSession.orderId;

      const payment = await submitPaymentTransaction({
        orderId,
        amount,
        billingInfo: paymentState.billingInfo,
        useMockPayment: USE_MOCK_PAYMENT,
        cardRef,
        getSquareConfig: Api.getSquareConfig,
        loadSquareSdk,
        ensurePaymentCardMounted: async (cfg) =>
          ensurePaymentCardMounted({
            cardRef,
            setPaymentState,
            destroyCardIfAny,
            applicationId: cfg?.applicationId,
            locationId: cfg?.locationId,
          }),
        chargeOrder: Api.chargeOrder,
        buildVerificationDetails,
      });

      if (payment?.hasKeyError) {
        return;
      }

      if (payment?.status === "COMPLETED") {
        const displayReserved = formatDisplayReserved(reservedDate);
        setLocalStorageJSON(
          ORDER_SNAPSHOT_CONFIG.KEY,
          buildOrderSnapshot({
            createdAtIso,
            reservedAtIso,
            orderId,
            itemsCart: cart,
            displayReserved,
          })
        );

        setPaymentOutcome({
          ok: true,
          orderId,
          error: null,
          receiptUrl: payment?.receiptUrl || null,
          displayReserved,
        });
      } else {
        setPaymentOutcome({
          ok: false,
          orderId,
          error: payment?.error || "決済が承認されませんでした",
          receiptUrl: null,
          displayReserved: formatDisplayReserved(reservedDate),
        });
      }
    } catch (e) {
      setPaymentOutcome({
        ok: false,
        orderId,
        error: e?.message || "決済処理中にエラーが発生しました",
        receiptUrl: null,
        displayReserved: formatDisplayReserved(reservedDate),
      });
    }
    dispatch({ type: "GOTO", step: "paymentResult" });
  }, [
    canUseLocalStorage,
    cart,
    selectedTime,
    paymentState.billingInfo,
    calculateSumPrice,
    dispatch,
    destroyCardIfAny,
    setPaymentOutcome,
  ]);

  useEffect(() => {
    if (step !== "payment") return;

    setPaymentState(INITIAL_PAYMENT_STATE);
    if (screenInitTimerRef.current) clearTimeout(screenInitTimerRef.current);
    destroyCardIfAny();

    screenInitTimerRef.current = setTimeout(async () => {
      try {
        await initializePaymentScreen({
          getSquareConfig: Api.getSquareConfig,
          loadSquareSdk,
          setPaymentState,
          useMockPayment: USE_MOCK_PAYMENT,
        });
      } catch (e) {
        handlePaymentInitializationFailure(e, "決済モジュールの初期化に失敗しました");
      }
    }, TIMEOUTS.PAYMENT_INIT_DELAY);

    return () => {
      if (screenInitTimerRef.current) clearTimeout(screenInitTimerRef.current);
      destroyCardIfAny();
    };
  }, [step]);

  useEffect(() => {
    if (step !== "payment") return;
    if (paymentState.phase !== "input") return;

    cardMountTimerRef.current = setTimeout(() => {
      (async () => {
        try {
          const cfg = await initializePaymentScreen({
            getSquareConfig: Api.getSquareConfig,
            loadSquareSdk,
            setPaymentState,
            useMockPayment: USE_MOCK_PAYMENT,
          });
          await ensurePaymentCardMounted({
            cardRef,
            setPaymentState,
            destroyCardIfAny,
            applicationId: cfg?.applicationId,
            locationId: cfg?.locationId,
          });
        } catch (e) {
          handlePaymentInitializationFailure(e, "#card-container の初期化に失敗しました");
        }
      })();
    }, TIMEOUTS.CARD_MOUNT_DELAY);

    return () => {
      if (cardMountTimerRef.current) clearTimeout(cardMountTimerRef.current);
    };
  }, [step, paymentState.phase, destroyCardIfAny, handlePaymentInitializationFailure]);

  return { paymentState, setPaymentState, handleSubmitOrderFlow };
}
