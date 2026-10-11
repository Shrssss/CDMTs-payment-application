// apiService.ts の実運用メソッド(createOrder/fetchAllItems/fetchOrder)を確認するテスト。
// getSquareConfigのテストはsrc/legacy/square/__tests__/getSquareConfig.test.jsへ移設した
// (Square廃止に伴い⚠️未使用のメソッドのため。実運用のAPI呼び出しはこのファイルで扱う)。
import { Api } from "../services/apiService";
import { API_ENDPOINTS } from "../constants/config";

describe("Api.fetchAllItems", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("正しいエンドポイントを叩き、取得した配列をそのまま返す", async () => {
    const items = [{ itemId: 10, itemName: "角煮 単品", price: 470, imagePath: "/x.jpg", available: true }];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(items),
    });

    await expect(Api.fetchAllItems()).resolves.toEqual(items);
    expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.ALL_ITEMS);
  });

  test("レスポンスがokでない場合はエラーを投げる", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(Api.fetchAllItems()).rejects.toThrow("商品情報の取得に失敗しました");
  });
});

describe("Api.createOrder", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("正しいURL・メソッド・ボディでPOSTし、素のorderIdをそのまま返す", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(42),
    });

    const result = await Api.createOrder({
      items: [{ itemId: 10, quantity: 1 }],
      drinkCounts: { 91: 1 },
      orderDate: "2026-08-30T12:00:00",
      reservedTime: "2026-08-30T12:30:00",
    });

    expect(result).toBe(42);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe(API_ENDPOINTS.ORDER_CREATE);
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(options.body)).toEqual({
      orderDate: "2026-08-30T12:00:00",
      reservedTime: "2026-08-30T12:30:00",
      items: [{ itemId: 10, quantity: 1 }],
      drinkCounts: { 91: 1 },
      servingStatus: 0,
      paymentStatus: false,
    });
  });

  test("servingStatus/paymentStatus/drinkCountsを省略した場合は既定値(0, false, {})を送る", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(1),
    });

    await Api.createOrder({
      items: [{ itemId: 10, quantity: 1 }],
      orderDate: "2026-08-30T12:00:00",
      reservedTime: "2026-08-30T12:30:00",
    });

    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.servingStatus).toBe(0);
    expect(body.paymentStatus).toBe(false);
    expect(body.drinkCounts).toEqual({});
  });

  test("レスポンスがokでない場合はエラーを投げる", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: jest.fn().mockResolvedValue("Bad Request"),
    });

    await expect(
      Api.createOrder({
        items: [{ itemId: 10, quantity: 1 }],
        orderDate: "2026-08-30T12:00:00",
        reservedTime: "2026-08-30T12:30:00",
      })
    ).rejects.toThrow("注文作成に失敗しました");
  });
});

describe("Api.fetchOrder", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("orderIdを含む正しいURLを叩き、取得結果をそのまま返す", async () => {
    const order = { orderId: 42, orderedItems: [] };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(order),
    });

    await expect(Api.fetchOrder(42)).resolves.toEqual(order);
    expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.ORDER_GET(42));
  });

  test("レスポンスがokでない場合はエラーを投げる", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });

    await expect(Api.fetchOrder(42)).rejects.toThrow("注文取得に失敗しました");
  });
});
