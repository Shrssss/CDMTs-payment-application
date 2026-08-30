// Menu.tsx(商品カード)の無効化ロジック(売り切れ・ドリンク差分・上限個数)と
// クリックハンドラを確認するテスト。全画面の数量ボタンを駆動する中核コンポーネント。
global.IS_REACT_ACT_ENVIRONMENT = true;

import { act } from "react";
import { createRoot } from "react-dom/client";

import { Menu } from "../components/Menu";

describe("Menu", () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.removeChild(container);
    container = null;
  });

  const render = (props) => {
    act(() => {
      root.render(
        <Menu id={10} itemName="角煮 単品" itemPrice={470} count={0} add={() => {}} remove={() => {}} {...props} />
      );
    });
  };

  test("renders name and price, and does not show a badge when count is 0", () => {
    render({});
    expect(container.textContent).toContain("角煮 単品");
    expect(container.textContent).toContain("470");
    // バッジ(個数表示)は count>0 のときだけ出る想定なので、count=0では出ない
    const badge = Array.from(container.querySelectorAll("div")).find((d) => d.textContent === "1");
    expect(badge).toBeUndefined();
  });

  test("shows a badge with the count when count > 0", () => {
    render({ count: 3 });
    const badge = Array.from(container.querySelectorAll("div")).find((d) => d.textContent === "3");
    expect(badge).toBeDefined();
  });

  test("remove button is disabled when count is 0, enabled when count > 0", () => {
    render({ count: 0 });
    let buttons = container.querySelectorAll("button");
    expect(buttons[0].disabled).toBe(true);

    render({ count: 1 });
    buttons = container.querySelectorAll("button");
    expect(buttons[0].disabled).toBe(false);
  });

  test("add button is disabled when sold out, even if count is low", () => {
    render({ count: 0, isSoldout: true });
    const buttons = container.querySelectorAll("button");
    expect(buttons[1].disabled).toBe(true);
    expect(container.textContent).toContain("売り切れ");
    expect(container.textContent).toContain("SOLD OUT");
  });

  test("add button is disabled on the drink screen once the difference reaches 0", () => {
    render({ count: 0, isDrinkScreen: true, difference: 0 });
    expect(container.querySelectorAll("button")[1].disabled).toBe(true);

    render({ count: 0, isDrinkScreen: true, difference: 1 });
    expect(container.querySelectorAll("button")[1].disabled).toBe(false);
  });

  test("add button is disabled once count reaches MAX_ITEM_QUANTITY(9)", () => {
    render({ count: 9 });
    expect(container.querySelectorAll("button")[1].disabled).toBe(true);

    render({ count: 8 });
    expect(container.querySelectorAll("button")[1].disabled).toBe(false);
  });

  test("clicking add/remove calls the callback with the item id", () => {
    const add = jest.fn();
    const remove = jest.fn();
    render({ id: 42, count: 1, add, remove });

    const buttons = container.querySelectorAll("button");
    act(() => buttons[0].click()); // ー
    act(() => buttons[1].click()); // ＋

    expect(remove).toHaveBeenCalledWith(42);
    expect(add).toHaveBeenCalledWith(42);
  });

  test("clicking a disabled button does not call the callback", () => {
    const add = jest.fn();
    render({ count: 0, isSoldout: true, add });

    const buttons = container.querySelectorAll("button");
    act(() => buttons[1].click());

    expect(add).not.toHaveBeenCalled();
  });
});
