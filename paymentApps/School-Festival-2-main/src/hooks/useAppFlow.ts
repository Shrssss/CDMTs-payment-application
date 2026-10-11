// 画面遷移とカート状態を管理し、各画面操作に必要な dispatch を返すフック。
import { useCallback, useReducer, useState } from "react";

import { INITIAL_APP_STATE, INITIAL_UI_STATE } from "../constants/initialState";
import { DRINK_TYPE_IDS } from "../constants/items";
import { STEPS_ARRAY, type Step } from "../constants/steps";
import { canProceedFromMenu } from "../features/order/orderEligibility";
import type { AppAction, AppState, Cart } from "../types";

const steps: Step[] = STEPS_ARRAY;

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

export const screenState = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "GOTO":
      if (!steps.includes(action.step)) return state;
      return { ...state, step: action.step };
    case "NEXT": {
      const currentIndex = steps.indexOf(state.step);
      if (currentIndex === -1) return state;
      if (currentIndex < steps.length - 1) {
        const nextStep = steps[currentIndex + 1];
        return { ...state, step: nextStep };
      }
      return state;
    }
    case "PREV": {
      const currentIndex = steps.indexOf(state.step);
      if (currentIndex === -1) return state;
      if (currentIndex > 0) {
        const prevStep = steps[currentIndex - 1];
        return { ...state, step: prevStep };
      }
      return state;
    }
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
    default:
      return state;
  }
};

export function useAppFlow() {
  const [state, dispatch] = useReducer(screenState, INITIAL_APP_STATE);
  const [selectedTime, setSelectedTime] = useState<string | null>(
    INITIAL_UI_STATE.selectedTime
  );

  const goto = useCallback((step: Step) => {
    dispatch({ type: "GOTO", step });
  }, []);

  const next = useCallback(() => {
    if (state.step === "menu") {
      if (!canProceedFromMenu(state.cart)) {
        dispatch({ type: "GOTO", step: "cart" });
        return;
      }
    }
    dispatch({ type: "NEXT" });
  }, [state.step, state.cart]);

  const prev = useCallback(() => {
    if (state.step === "cart") {
      dispatch({ type: "CLEAR_TEMPORARY_DRINKS" });
      dispatch({ type: "GOTO", step: "menu" });
      return;
    }
    dispatch({ type: "PREV" });
  }, [state.step]);

  const addItems = useCallback((itemId: number) => {
    dispatch({ type: "CHANGE_ITEM_QUANTITY", itemId, delta: 1 });
  }, []);

  const removeItems = useCallback((itemId: number) => {
    dispatch({ type: "CHANGE_ITEM_QUANTITY", itemId, delta: -1 });
  }, []);

  return {
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
