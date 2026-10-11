// ⚠️ 未使用(Square廃止に伴い隔離)
// Api.getSquareConfig(src/services/apiService.ts)の real / mock モード別の
// fallback挙動を確認するテスト。getSquareConfig自体はapiService.ts(アクティブな
// ファイル)に定義されているが、Square廃止に伴いメソッド自体が「⚠️ 未使用」と
// されており、src/legacy/square/以外から呼ばれることはない。そのため、テストも
// アクティブなsrc/__tests__/ではなくこちらに置いている
// (元はsrc/__tests__/apiService.test.jsにあったが、実際に使われているメソッド
// (createOrder/fetchAllItems/fetchOrder)のテストと紛らわしいため移設した)。
describe("Api.getSquareConfig", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("fails closed in real mode when square config cannot be fetched", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: { get: jest.fn().mockReturnValue("application/json") },
      text: jest.fn().mockResolvedValue(""),
    });

    const { Api } = require("../../../services/apiService");

    await expect(Api.getSquareConfig({ useMockPayment: false })).rejects.toThrow(
      "Square設定の取得に失敗しました"
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/square/config",
      expect.objectContaining({
        headers: { Accept: "application/json" },
      })
    );
  });

  test("falls back to env config in mock mode when backend config is unavailable", async () => {
    process.env.VITE_SQUARE_APP_ID = "sq0idp-mock-app";
    process.env.VITE_SQUARE_LOCATION_ID = "mock-location";
    process.env.VITE_SQUARE_ENV = "sandbox";

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: { get: jest.fn().mockReturnValue("application/json") },
      text: jest.fn().mockResolvedValue(""),
    });

    const { Api } = require("../../../services/apiService");

    await expect(Api.getSquareConfig({ useMockPayment: true })).resolves.toEqual({
      applicationId: "sq0idp-mock-app",
      locationId: "mock-location",
      environment: "SANDBOX",
    });

    // 存在しない旧フォールバック(/api/payment/get/ApplicationId)は呼ばず、
    // /api/square/config の失敗後は直接 SQUARE_FALLBACK_CONFIG へ進む。
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
