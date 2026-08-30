// Order.jsx が「商品(価格あり)」と「選んだドリンク(価格なし)」を
// 紐付けない2つの独立したリストとして表示することを確認するテスト。
global.IS_REACT_ACT_ENVIRONMENT = true;

import { act } from "react";
import { createRoot } from "react-dom/client";

import { Order } from "../components/Order";

describe("Order", () => {
  let container;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  test("empty cart shows a placeholder message", () => {
    act(() => {
      createRoot(container).render(<Order cart={{}} price={{}} names={{}} />);
    });

    expect(container.textContent).toContain("カートは空です");
  });

  test("shows category items with price and drinks without price, as separate lists, and computes total from categories only", () => {
    const cart = { 10: 2, 40: 1, 91: 1, 92: 2 };
    const price = { 10: 470, 40: 570 };
    const names = { 10: "角煮 単品", 40: "角煮ドリンクセット", 91: "コーラ", 92: "オレンジ" };

    act(() => {
      createRoot(container).render(<Order cart={cart} price={price} names={names} />);
    });

    const text = container.textContent;
    expect(text).toContain("角煮 単品");
    expect(text).toContain("角煮ドリンクセット");
    expect(text).toContain("選んだドリンク");
    expect(text).toContain("コーラ");
    expect(text).toContain("オレンジ");

    // 合計: 470*2 + 570*1 = 1510 (ドリンクは価格に加算されない)
    expect(text).toContain("1,510");
    // 合計個数: 2 + 1 = 3 (ドリンクは個数にも加算されない)
    expect(text).toContain("3個");
  });

  test("drink-only cart shows no category rows or total price, but still lists drinks", () => {
    const cart = { 91: 1 };
    const names = { 91: "コーラ" };

    act(() => {
      createRoot(container).render(<Order cart={cart} price={{}} names={names} />);
    });

    const text = container.textContent;
    expect(text).toContain("選んだドリンク");
    expect(text).toContain("コーラ");
    expect(text).not.toContain("カートは空です");
  });
});
