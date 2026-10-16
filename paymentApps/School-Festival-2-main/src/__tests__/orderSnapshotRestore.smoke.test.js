// タイトル画面の「これまでのご注文」一覧（localStorage の注文履歴）を実際にDOM上で確認するテスト。
global.IS_REACT_ACT_ENVIRONMENT = true;

import { act } from "react";
import { createRoot } from "react-dom/client";

import { App } from "../App";
import { ORDER_HISTORY_CONFIG } from "../constants/config";

const historyButtons = (container) =>
  Array.from(container.querySelectorAll("button")).filter((b) =>
    b.textContent.startsWith("注文番号")
  );
const findButtonByText = (container, text) =>
  Array.from(container.querySelectorAll("button")).find((b) => b.textContent === text);

const minutesAgo = (m) => new Date(Date.now() - m * 60 * 1000).toISOString();

describe("title screen order history (localStorage)", () => {
  let container;
  let root;

  beforeEach(() => {
    window.localStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.removeChild(container);
    container = null;
  });

  test("履歴が無ければ一覧を出さない", () => {
    act(() => root.render(<App />));

    expect(container.textContent).toContain("注文に進む");
    expect(container.textContent).not.toContain("これまでのご注文");
    expect(historyButtons(container)).toHaveLength(0);
  });

  test("複数の注文を新しい順に全部並べ、予約時刻を過ぎた注文も消さない", () => {
    const history = [
      { createdAt: minutesAgo(10), reservedAtIso: minutesAgo(-20), orderId: 300,
        itemsCart: { 10: 1 }, displayReserved: "2026-10-16 15:00" },
      // 予約から何時間も経った注文(以前は削除されていた)
      { createdAt: minutesAgo(5 * 60), reservedAtIso: minutesAgo(4 * 60), orderId: 100,
        itemsCart: { 20: 2 }, displayReserved: "2026-10-16 11:00" },
      { createdAt: minutesAgo(3 * 60), reservedAtIso: minutesAgo(2 * 60), orderId: 200,
        itemsCart: { 30: 1 }, displayReserved: "2026-10-16 13:00" },
    ];
    window.localStorage.setItem(ORDER_HISTORY_CONFIG.KEY, JSON.stringify(history));

    act(() => root.render(<App />));

    expect(container.textContent).toContain("これまでのご注文");
    const buttons = historyButtons(container);
    expect(buttons.map((b) => b.textContent)).toEqual([
      "注文番号 3002026-10-16 15:00 受取",
      "注文番号 2002026-10-16 13:00 受取",
      "注文番号 1002026-10-16 11:00 受取",
    ]);
    expect(JSON.parse(window.localStorage.getItem(ORDER_HISTORY_CONFIG.KEY))).toHaveLength(3);
  });

  test("選んだ注文の番号札を出し、タイトルに戻って別の注文も見られる", () => {
    window.localStorage.setItem(
      ORDER_HISTORY_CONFIG.KEY,
      JSON.stringify([
        { createdAt: minutesAgo(10), reservedAtIso: minutesAgo(-20), orderId: "NEW-2",
          itemsCart: { 10: 1 }, displayReserved: "12:34" },
        { createdAt: minutesAgo(90), reservedAtIso: minutesAgo(60), orderId: "OLD-1",
          itemsCart: { 20: 1 }, displayReserved: "11:00" },
      ])
    );

    act(() => root.render(<App />));
    act(() => historyButtons(container)[1].click());

    expect(container.textContent).toContain("ご注文ありがとうございます");
    expect(container.textContent).toContain("OLD-1");
    expect(container.textContent).toContain("11:00");

    act(() => findButtonByText(container, "タイトルに戻る").click());
    expect(container.textContent).toContain("これまでのご注文");

    act(() => historyButtons(container)[0].click());
    expect(container.textContent).toContain("NEW-2");
    expect(container.textContent).not.toContain("OLD-1");
  });
});
