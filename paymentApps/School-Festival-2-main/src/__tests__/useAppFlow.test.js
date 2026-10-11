// useAppFlow.ts の reducer(画面遷移・カート操作)と、next/prev/addItems/removeItems
// コールバックの挙動を確認するテスト。
global.IS_REACT_ACT_ENVIRONMENT = true;

import { act } from "react";
import { createRoot } from "react-dom/client";

import { screenState, useAppFlow } from "../hooks/useAppFlow";
import { INITIAL_APP_STATE } from "../constants/initialState";
import { STEPS_ARRAY } from "../constants/steps";

describe("screenState reducer", () => {
  test("GOTO moves to a valid step", () => {
    const next = screenState(INITIAL_APP_STATE, { type: "GOTO", step: "menu" });
    expect(next.step).toBe("menu");
  });

  test("GOTO ignores an invalid step and returns the same state", () => {
    const next = screenState(INITIAL_APP_STATE, { type: "GOTO", step: "not-a-real-step" });
    expect(next).toBe(INITIAL_APP_STATE);
  });

  test("NEXT advances to the following step in STEPS_ARRAY order", () => {
    const state = { ...INITIAL_APP_STATE, step: STEPS_ARRAY[0] };
    const next = screenState(state, { type: "NEXT" });
    expect(next.step).toBe(STEPS_ARRAY[1]);
  });

  test("NEXT is a no-op at the last step", () => {
    const lastStep = STEPS_ARRAY[STEPS_ARRAY.length - 1];
    const state = { ...INITIAL_APP_STATE, step: lastStep };
    const next = screenState(state, { type: "NEXT" });
    expect(next.step).toBe(lastStep);
  });

  test("PREV moves to the previous step", () => {
    const state = { ...INITIAL_APP_STATE, step: STEPS_ARRAY[2] };
    const next = screenState(state, { type: "PREV" });
    expect(next.step).toBe(STEPS_ARRAY[1]);
  });

  test("PREV is a no-op at the first step", () => {
    const state = { ...INITIAL_APP_STATE, step: STEPS_ARRAY[0] };
    const next = screenState(state, { type: "PREV" });
    expect(next.step).toBe(STEPS_ARRAY[0]);
  });

  test("CHANGE_ITEM_QUANTITY increments a fresh item", () => {
    const next = screenState(INITIAL_APP_STATE, {
      type: "CHANGE_ITEM_QUANTITY",
      itemId: 10,
      delta: 1,
    });
    expect(next.cart[10]).toBe(1);
  });

  test("CHANGE_ITEM_QUANTITY never goes below 0", () => {
    const state = { ...INITIAL_APP_STATE, cart: { ...INITIAL_APP_STATE.cart, 10: 0 } };
    const next = screenState(state, { type: "CHANGE_ITEM_QUANTITY", itemId: 10, delta: -1 });
    expect(next.cart[10]).toBe(0);
  });

  test("CLEAR_TEMPORARY_DRINKS zeroes only drink type ids, leaves other items untouched", () => {
    const state = { ...INITIAL_APP_STATE, cart: { ...INITIAL_APP_STATE.cart, 10: 3, 91: 2, 92: 1 } };
    const next = screenState(state, { type: "CLEAR_TEMPORARY_DRINKS" });
    expect(next.cart[91]).toBe(0);
    expect(next.cart[92]).toBe(0);
    expect(next.cart[10]).toBe(3);
  });

  test("REPLACE_CART merges given keys and keeps the rest", () => {
    const state = { ...INITIAL_APP_STATE, cart: { ...INITIAL_APP_STATE.cart, 10: 1, 20: 2 } };
    const next = screenState(state, { type: "REPLACE_CART", cart: { 10: 5 } });
    expect(next.cart[10]).toBe(5);
    expect(next.cart[20]).toBe(2);
  });
});

describe("useAppFlow hook (next/prev/addItems/removeItems)", () => {
  let container;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  const renderHarness = () => {
    let captured;
    function Harness() {
      captured = useAppFlow();
      return null;
    }
    act(() => {
      createRoot(container).render(<Harness />);
    });
    return () => captured;
  };

  test("next() redirects to cart instead of advancing when nothing is selected on the menu step", () => {
    const getCaptured = renderHarness();

    act(() => getCaptured().goto("menu"));
    expect(getCaptured().state.step).toBe("menu");

    act(() => getCaptured().next());
    expect(getCaptured().state.step).toBe("cart");
  });

  test("next() advances to drink selection when a set/drink item is selected", () => {
    // canProceedFromMenu()は「ドリンクを伴う商品(30/40/50)」の合計数だけを見る。
    // 単品(10/20)だけ選んでも、ドリンク選択は不要なのでcartへ直行する(下のテスト参照)。
    const getCaptured = renderHarness();

    act(() => getCaptured().goto("menu"));
    act(() => getCaptured().addItems(40)); // 角煮ドリンクセット
    act(() => getCaptured().next());

    expect(getCaptured().state.step).toBe("drink");
  });

  test("next() skips drink selection and goes straight to cart when only a drink-less item is selected", () => {
    const getCaptured = renderHarness();

    act(() => getCaptured().goto("menu"));
    act(() => getCaptured().addItems(10)); // 角煮 単品(ドリンクを伴わない)
    act(() => getCaptured().next());

    expect(getCaptured().state.step).toBe("cart");
  });

  test("prev() from cart clears temporary drink selections and returns to menu", () => {
    const getCaptured = renderHarness();

    act(() => getCaptured().goto("cart"));
    act(() => getCaptured().addItems(91));
    expect(getCaptured().state.cart[91]).toBe(1);

    act(() => getCaptured().prev());

    expect(getCaptured().state.step).toBe("menu");
    expect(getCaptured().state.cart[91]).toBe(0);
  });

  test("addItems/removeItems change quantity through CHANGE_ITEM_QUANTITY", () => {
    const getCaptured = renderHarness();

    act(() => getCaptured().addItems(20));
    expect(getCaptured().state.cart[20]).toBe(1);

    act(() => getCaptured().removeItems(20));
    expect(getCaptured().state.cart[20]).toBe(0);
  });
});
