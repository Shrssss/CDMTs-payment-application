// useAppFlow.ts の reducer(カート操作)、next/prev の行き先、
// URL(react-router)を使った画面遷移コールバックの挙動を確認するテスト。
global.IS_REACT_ACT_ENVIRONMENT = true;

import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";

import { cartReducer, nextStepOf, prevStepOf, useAppFlow } from "../hooks/useAppFlow";
import { INITIAL_APP_STATE } from "../constants/initialState";
import { STEP_PATHS, stepFromPath } from "../constants/steps";

describe("stepFromPath", () => {
  test("各画面のURLから画面名を引ける", () => {
    for (const [step, path] of Object.entries(STEP_PATHS)) {
      expect(stepFromPath(path)).toBe(step);
    }
  });

  test("末尾のスラッシュは無視し、未知のURLは null", () => {
    expect(stepFromPath("/menu/")).toBe("menu");
    expect(stepFromPath("/no-such-page")).toBeNull();
  });
});

describe("nextStepOf / prevStepOf", () => {
  test("フッターの「次へ」はタイトル→メニュー→…→決済方法の順に進む", () => {
    expect(nextStepOf("title", {})).toBe("menu");
    expect(nextStepOf("drink", {})).toBe("cart");
    expect(nextStepOf("cart", {})).toBe("time");
    expect(nextStepOf("time", {})).toBe("paymentMethod");
  });

  test("決済方法の選択以降と未知の画面には「次へ」の行き先がない", () => {
    expect(nextStepOf("paymentMethod", {})).toBeNull();
    expect(nextStepOf("numberTag", {})).toBeNull();
    expect(nextStepOf(null, {})).toBeNull();
  });

  test("フッターの「戻る」は drink/cart→menu、time→cart", () => {
    expect(prevStepOf("drink")).toBe("menu");
    expect(prevStepOf("cart")).toBe("menu");
    expect(prevStepOf("time")).toBe("cart");
    expect(prevStepOf("menu")).toBeNull();
  });
});

describe("cartReducer", () => {
  test("CHANGE_ITEM_QUANTITY increments a fresh item", () => {
    const next = cartReducer(INITIAL_APP_STATE, {
      type: "CHANGE_ITEM_QUANTITY",
      itemId: 10,
      delta: 1,
    });
    expect(next.cart[10]).toBe(1);
  });

  test("CHANGE_ITEM_QUANTITY never goes below 0", () => {
    const state = { ...INITIAL_APP_STATE, cart: { ...INITIAL_APP_STATE.cart, 10: 0 } };
    const next = cartReducer(state, { type: "CHANGE_ITEM_QUANTITY", itemId: 10, delta: -1 });
    expect(next.cart[10]).toBe(0);
  });

  test("CLEAR_TEMPORARY_DRINKS zeroes only drink type ids, leaves other items untouched", () => {
    const state = { ...INITIAL_APP_STATE, cart: { ...INITIAL_APP_STATE.cart, 10: 3, 91: 2, 92: 1 } };
    const next = cartReducer(state, { type: "CLEAR_TEMPORARY_DRINKS" });
    expect(next.cart[91]).toBe(0);
    expect(next.cart[92]).toBe(0);
    expect(next.cart[10]).toBe(3);
  });

  test("REPLACE_CART merges given keys and keeps the rest", () => {
    const state = { ...INITIAL_APP_STATE, cart: { ...INITIAL_APP_STATE.cart, 10: 1, 20: 2 } };
    const next = cartReducer(state, { type: "REPLACE_CART", cart: { 10: 5 } });
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
      createRoot(container).render(
        <MemoryRouter>
          <Harness />
        </MemoryRouter>
      );
    });
    return () => captured;
  };

  test("初期表示はタイトル、goto で URL と画面が切り替わる", () => {
    const getCaptured = renderHarness();
    expect(getCaptured().step).toBe("title");

    act(() => getCaptured().goto("paymentMethod"));
    expect(getCaptured().step).toBe("paymentMethod");
  });

  test("goto は画面遷移しても同じ関数のまま(依存する useEffect を再実行させない)", () => {
    const getCaptured = renderHarness();
    const first = getCaptured().goto;

    act(() => getCaptured().goto("menu"));
    act(() => getCaptured().goto("cart"));

    expect(getCaptured().goto).toBe(first);
  });

  test("next() redirects to cart instead of advancing when nothing is selected on the menu step", () => {
    const getCaptured = renderHarness();

    act(() => getCaptured().goto("menu"));
    expect(getCaptured().step).toBe("menu");

    act(() => getCaptured().next());
    expect(getCaptured().step).toBe("cart");
  });

  test("next() advances to drink selection when a set/drink item is selected", () => {
    // canProceedFromMenu()は「ドリンクを伴う商品(30/40/50)」の合計数だけを見る。
    // 単品(10/20)だけ選んでも、ドリンク選択は不要なのでcartへ直行する(下のテスト参照)。
    const getCaptured = renderHarness();

    act(() => getCaptured().goto("menu"));
    act(() => getCaptured().addItems(40)); // 角煮ドリンクセット
    act(() => getCaptured().next());

    expect(getCaptured().step).toBe("drink");
  });

  test("next() skips drink selection and goes straight to cart when only a drink-less item is selected", () => {
    const getCaptured = renderHarness();

    act(() => getCaptured().goto("menu"));
    act(() => getCaptured().addItems(10)); // 角煮 単品(ドリンクを伴わない)
    act(() => getCaptured().next());

    expect(getCaptured().step).toBe("cart");
  });

  test("prev() from cart clears temporary drink selections and returns to menu", () => {
    const getCaptured = renderHarness();

    act(() => getCaptured().goto("cart"));
    act(() => getCaptured().addItems(91));
    expect(getCaptured().state.cart[91]).toBe(1);

    act(() => getCaptured().prev());

    expect(getCaptured().step).toBe("menu");
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
