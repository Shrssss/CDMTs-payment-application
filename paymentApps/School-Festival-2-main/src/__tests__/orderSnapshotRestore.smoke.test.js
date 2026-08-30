// タイトル画面からの注文番号確認ボタン（localStorage復元）を実際にDOM上で確認するテスト。
global.IS_REACT_ACT_ENVIRONMENT = true;

import { act } from "react";
import { createRoot } from "react-dom/client";

import { App } from "../App";
import { ORDER_SNAPSHOT_CONFIG } from "../constants/config";

const findButtonByText = (container, text) =>
  Array.from(container.querySelectorAll("button")).find((b) => b.textContent === text);

describe("title screen saved-order restore (localStorage)", () => {
  let container;

  beforeEach(() => {
    window.localStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  test("no button when localStorage has no saved order", () => {
    const root = createRoot(container);
    act(() => {
      root.render(<App />);
    });

    expect(container.textContent).toContain("注文に進む");
    expect(findButtonByText(container, "注文番号を確認する")).toBeUndefined();
  });

  test("button appears after reload when a valid snapshot exists, and navigates to the number tag screen", () => {
    const reservedAtIso = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    window.localStorage.setItem(
      ORDER_SNAPSHOT_CONFIG.KEY,
      JSON.stringify({
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        reservedAtIso,
        orderId: "SMOKE-TEST-123",
        itemsCart: { 10: 1 },
        displayReserved: "12:34",
      })
    );

    const root = createRoot(container);
    act(() => {
      root.render(<App />);
    });

    const savedOrderBtn = findButtonByText(container, "注文番号を確認する");
    expect(savedOrderBtn).toBeDefined();

    act(() => {
      savedOrderBtn.click();
    });

    expect(container.textContent).toContain("ご注文ありがとうございます");
    expect(container.textContent).toContain("SMOKE-TEST-123");
  });

  test("expired snapshot (reserved more than 1 hour ago) does not show the button", () => {
    const reservedAtIso = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    window.localStorage.setItem(
      ORDER_SNAPSHOT_CONFIG.KEY,
      JSON.stringify({
        createdAt: new Date(Date.now() - 2.2 * 60 * 60 * 1000).toISOString(),
        reservedAtIso,
        orderId: "EXPIRED-ORDER",
        itemsCart: { 10: 1 },
        displayReserved: "10:00",
      })
    );

    const root = createRoot(container);
    act(() => {
      root.render(<App />);
    });

    expect(findButtonByText(container, "注文番号を確認する")).toBeUndefined();
    expect(window.localStorage.getItem(ORDER_SNAPSHOT_CONFIG.KEY)).toBeNull();
  });
});
