// 画面遷移とカート状態を管理し、各画面操作に必要な dispatch / goto を返すフック。
// 現在の画面は URL(react-router)から決まる。カートは useReducer で保持する。
import { useCallback, useLayoutEffect, useReducer, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { INITIAL_APP_STATE, INITIAL_UI_STATE } from "../constants/initialState";
import { DRINK_TYPE_IDS } from "../constants/items";
import { STEP_PATHS, stepFromPath, type Step } from "../constants/steps";
import { canProceedFromMenu } from "../features/order/orderEligibility";
import type { AppAction, AppState, Cart, Goto } from "../types";

const applyItemQuantityDelta = (state: AppState, itemId: number, delta: number): AppState => {
  const currentCount = state.cart[itemId] || 0;
  const nextCount = currentCount + delta;

  if (nextCount <= 0) {
    if (currentCount <= 0) return state;
    return {
      ...state,
      cart: {
        ...state.cart,
        [itemId]: 0,
      },
    };
  }

  return {
    ...state,
    cart: {
      ...state.cart,
      [itemId]: nextCount,
    },
  };
};

export const cartReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "CHANGE_ITEM_QUANTITY": {
      const { itemId, delta } = action;
      return applyItemQuantityDelta(state, itemId, delta);
    }
    case "CLEAR_TEMPORARY_DRINKS": {
      const newCart: Cart = { ...state.cart };
      for (const drinkId of DRINK_TYPE_IDS) {
        newCart[drinkId] = 0;
      }
      return { ...state, cart: newCart };
    }
    case "REPLACE_CART": {
      return { ...state, cart: { ...state.cart, ...action.cart } };
    }
    case "RESET_CART": {
      return { ...state, cart: INITIAL_APP_STATE.cart };
    }
    default:
      return state;
  }
};

// タイトルの「注文に進む」とフッターの「次へ」の行き先。
// 決済方法の選択以降は、各ページのボタンが goto で直接遷移する。
export const nextStepOf = (step: Step | null, cart: Cart): Step | null => {
  switch (step) {
    case "title":
      return "menu";
    case "menu":
      // ドリンクを伴う商品があればドリンク選択へ、なければカートへ直行する。
      return canProceedFromMenu(cart) ? "drink" : "cart";
    case "drink":
      return "cart";
    case "cart":
      return "time";
    case "time":
      return "paymentMethod";
    default:
      return null;
  }
};

// フッターの「戻る」の行き先。
export const prevStepOf = (step: Step | null): Step | null => {
  switch (step) {
    case "drink":
    case "cart":
      return "menu";
    case "time":
      return "cart";
    default:
      return null;
  }
};

export function useAppFlow() {
  const [state, dispatch] = useReducer(cartReducer, INITIAL_APP_STATE);
  const [selectedTime, setSelectedTime] = useState<string | null>(
    INITIAL_UI_STATE.selectedTime
  );
  const navigate = useNavigate();
  const step = stepFromPath(useLocation().pathname);

  // useNavigate() の関数は URL が変わるたびに作り直される。goto を依存に持つ useEffect
  // (usePaymentReturn の自動照会など)が画面遷移のたびに再実行されないよう、goto 自体は固定する。
  const navigateRef = useRef(navigate);
  useLayoutEffect(() => {
    navigateRef.current = navigate;
  });
  const goto = useCallback<Goto>((to, options = {}) => {
    const { search, replace } = options;
    navigateRef.current({ pathname: STEP_PATHS[to], search }, { replace });
  }, []);

  const next = useCallback(() => {
    const to = nextStepOf(step, state.cart);
    if (to) goto(to);
  }, [step, state.cart, goto]);

  const prev = useCallback(() => {
    const to = prevStepOf(step);
    if (!to) return;
    // メニューへ戻るときは、選び直しで数が合わなくなるドリンク選択をいったん消す。
    if (step === "cart") dispatch({ type: "CLEAR_TEMPORARY_DRINKS" });
    goto(to);
  }, [step, goto]);

  const addItems = useCallback((itemId: number) => {
    dispatch({ type: "CHANGE_ITEM_QUANTITY", itemId, delta: 1 });
  }, []);

  const removeItems = useCallback((itemId: number) => {
    dispatch({ type: "CHANGE_ITEM_QUANTITY", itemId, delta: -1 });
  }, []);

  return {
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
  };
}
