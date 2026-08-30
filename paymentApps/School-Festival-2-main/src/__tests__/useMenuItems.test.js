// useMenuItems.js の挙動(モックスイッチ・取得成功/失敗時の状態遷移)を確認するテスト。
// jest.resetModules() を使うため、react / react-dom も各テストごとに動的requireし、
// フックが参照するReactインスタンスとレンダリングに使うReactインスタンスを一致させる。
global.IS_REACT_ACT_ENVIRONMENT = true;

describe("useMenuItems", () => {
  const originalEnv = { ...process.env };
  let container;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
    process.env = originalEnv;
  });

  test("USE_MOCK_MENUがオンの場合、fetchを呼ばずモック値を返す", async () => {
    process.env.VITE_USE_MOCK_MENU = "true";
    const fetchAllItems = jest.fn();
    jest.doMock("../services/apiService", () => ({ Api: { fetchAllItems } }));

    const React = require("react");
    const { createRoot } = require("react-dom/client");
    const { act } = React;
    const { useMenuItems } = require("../hooks/useMenuItems");
    const { MOCK_MENU_PRICES, MOCK_MENU_ITEM_NAMES } = require("../constants/mocks/menuMock");

    let captured;
    function Harness() {
      captured = useMenuItems("menu");
      return null;
    }

    await act(async () => {
      createRoot(container).render(React.createElement(Harness));
    });

    expect(fetchAllItems).not.toHaveBeenCalled();
    expect(captured.prices).toEqual(MOCK_MENU_PRICES);
    expect(captured.itemNames).toEqual(MOCK_MENU_ITEM_NAMES);
    expect(captured.fetchError).toBe(false);
  });

  test("USE_MOCK_MENUがオフでfetchが成功した場合、取得結果を反映する", async () => {
    process.env.VITE_USE_MOCK_MENU = "false";
    const fetchAllItems = jest.fn().mockResolvedValue([
      { itemId: 10, itemName: "テスト角煮", price: 999, imagePath: "/x.jpg", available: true },
      { itemId: 91, itemName: "テストコーラ", price: 0, imagePath: "/y.jpg", available: false },
    ]);
    jest.doMock("../services/apiService", () => ({ Api: { fetchAllItems } }));

    const React = require("react");
    const { createRoot } = require("react-dom/client");
    const { act } = React;
    const { useMenuItems } = require("../hooks/useMenuItems");

    let captured;
    function Harness() {
      captured = useMenuItems("menu");
      return null;
    }

    await act(async () => {
      createRoot(container).render(React.createElement(Harness));
    });
    // useEffect内のPromiseの解決を待つ
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchAllItems).toHaveBeenCalledTimes(1);
    expect(captured.fetchError).toBe(false);
    expect(captured.prices[10]).toBe(999);
    expect(captured.itemNames[10]).toBe("テスト角煮");
    expect(captured.imagePaths[10]).toBe("/x.jpg");
    expect(captured.isSoldout[91]).toBe(true);
  });

  test("USE_MOCK_MENUがオフでfetchが失敗した場合、fetchErrorを立てハードコード値へフォールバックしない", async () => {
    process.env.VITE_USE_MOCK_MENU = "false";
    const fetchAllItems = jest.fn().mockRejectedValue(new Error("network error"));
    jest.doMock("../services/apiService", () => ({ Api: { fetchAllItems } }));

    const React = require("react");
    const { createRoot } = require("react-dom/client");
    const { act } = React;
    const { useMenuItems } = require("../hooks/useMenuItems");

    let captured;
    function Harness() {
      captured = useMenuItems("menu");
      return null;
    }

    await act(async () => {
      createRoot(container).render(React.createElement(Harness));
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(captured.fetchError).toBe(true);
    // サイレントにハードコード値へフォールバックしないことを確認
    expect(captured.prices).toEqual({});
    expect(captured.itemNames).toEqual({});
  });

  test("menuステップ以外では取得しない", async () => {
    process.env.VITE_USE_MOCK_MENU = "false";
    const fetchAllItems = jest.fn().mockResolvedValue([]);
    jest.doMock("../services/apiService", () => ({ Api: { fetchAllItems } }));

    const React = require("react");
    const { createRoot } = require("react-dom/client");
    const { act } = React;
    const { useMenuItems } = require("../hooks/useMenuItems");

    let captured;
    function Harness() {
      captured = useMenuItems("title");
      return null;
    }

    await act(async () => {
      createRoot(container).render(React.createElement(Harness));
    });

    expect(fetchAllItems).not.toHaveBeenCalled();
    expect(captured.fetchError).toBe(false);
  });
});
